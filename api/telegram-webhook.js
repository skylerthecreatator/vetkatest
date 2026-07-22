import { BOUQUET_DAY_KEY, getRedis, getTelegramWebhookSecret } from '../lib/bouquet-day.js';

function getBody(req) {
    if (typeof req.body !== 'string') return req.body || {};
    try { return JSON.parse(req.body); } catch { return {}; }
}

function isExpectedChannel(chat) {
    const configured = String(process.env.TELEGRAM_CHANNEL_ID || '@vetka_2024').trim().toLowerCase();
    const username = chat?.username ? `@${String(chat.username).toLowerCase()}` : '';
    return String(chat?.id || '') === configured || username === configured;
}

function cleanLine(line) {
    return line
        .replace(/#букет_?дня(?:_ветка)?(?=\s|$)/gi, '')
        .replace(/(?:^|\s)букет\s+дня(?=\s|$)\s*[:—-]?/gi, '')
        .replace(/^[^\p{L}\p{N}]+/u, '')
        .trim();
}

export function parseBouquetPost(post) {
    const text = String(post.caption || post.text || '').trim();
    if (!/(?:#букет_?дня(?:_ветка)?(?=\s|$)|(?:^|\s)букет\s+дня(?=\s|$))/i.test(text)) return null;

    const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
    const pricePattern = /(?:от\s*)?\d[\d\s]*\s*(?:₽|руб(?:\.|лей)?)/gi;
    const oldPriceMatch = text.match(/старая\s+цена\s*[:—-]?\s*((?:от\s*)?\d[\d\s]*\s*(?:₽|руб(?:\.|лей)?))/i);
    const newPriceMatch = text.match(/новая\s+цена\s*[:—-]?\s*((?:от\s*)?\d[\d\s]*\s*(?:₽|руб(?:\.|лей)?))/i);
    const allPrices = Array.from(text.matchAll(pricePattern), match => match[0]);
    const rawPrice = newPriceMatch?.[1] || allPrices.at(-1) || '';
    const rawOldPrice = oldPriceMatch?.[1] || '';
    const price = rawPrice.replace(/\s+/g, ' ').trim();
    const oldPrice = rawOldPrice.replace(/\s+/g, ' ').trim();
    const numericPrice = Number(price.replace(/\D/g, ''));
    const numericOldPrice = Number(oldPrice.replace(/\D/g, ''));
    const discountPercent = numericOldPrice > numericPrice && numericPrice > 0
        ? Math.round((1 - numericPrice / numericOldPrice) * 100)
        : null;
    const contentLines = lines.filter(line => {
        if (/(?:старая|новая)\s+цена/i.test(line)) return false;
        return !/(?:от\s*)?\d[\d\s]*\s*(?:₽|руб(?:\.|лей)?)/i.test(line);
    });
    const availabilityLine = contentLines.find(line => /(?:букет|композици\w*)\s+в\s+наличии/i.test(line));
    const firstContentLine = contentLines.find(line => line !== availabilityLine);
    const defaultTitle = /композици/i.test(availabilityLine || '') ? 'Композиция дня' : 'Букет дня';
    const title = (firstContentLine || defaultTitle).replace(/^[:—~\-\s]+|[:—~\-\s]+$/g, '').trim();
    const description = (availabilityLine || contentLines.filter(line => line !== firstContentLine).join(' '))
        .replace(/^[^\p{L}\p{N}]+/u, '')
        .trim();
    const photos = Array.isArray(post.photo) ? post.photo : [];
    const largestPhoto = photos.reduce((largest, photo) => {
        const size = Number(photo.file_size || (photo.width || 0) * (photo.height || 0));
        const largestSize = Number(largest?.file_size || (largest?.width || 0) * (largest?.height || 0));
        return size > largestSize ? photo : largest;
    }, null);

    return {
        title: title.slice(0, 120),
        description: description.slice(0, 500),
        price: price.slice(0, 60),
        oldPrice: oldPrice.slice(0, 60),
        discountPercent,
        photoFileId: largestPhoto?.file_id || null,
    };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const expectedSecret = getTelegramWebhookSecret();
    const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (!expectedSecret) return res.status(503).json({ ok: false, error: 'webhook_not_configured' });
    if (receivedSecret !== expectedSecret) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const update = getBody(req);
    const post = update.channel_post || update.edited_channel_post;
    if (!post || !isExpectedChannel(post.chat)) return res.status(200).json({ ok: true, ignored: true });

    const bouquet = parseBouquetPost(post);
    if (!bouquet) return res.status(200).json({ ok: true, ignored: true });

    const redis = getRedis();
    if (!redis) return res.status(503).json({ ok: false, error: 'storage_not_configured' });

    const username = post.chat?.username || 'vetka_2024';
    const record = {
        ...bouquet,
        sourcePostUrl: `https://t.me/${username}/${post.message_id}`,
        channelId: post.chat.id,
        messageId: post.message_id,
        publishedAt: new Date(Number(post.date || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
    };

    try {
        await redis.set(BOUQUET_DAY_KEY, JSON.stringify(record));
        return res.status(200).json({ ok: true, updated: true });
    } catch (error) {
        console.error('Bouquet day save failed:', error);
        return res.status(503).json({ ok: false, error: 'storage_unavailable' });
    }
}
