import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';

export const BOUQUET_DAY_KEY = 'vetka:bouquet-day:current';

function decodeHtml(value) {
    return String(value || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function textFromTelegramHtml(value) {
    return decodeHtml(String(value || '')
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<\/p>|<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, ' '))
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function parsePublicBouquetText(text) {
    if (!/(?:#букет_?дня(?:_ветка)?(?=\s|$)|(?:^|\s)букет\s+дня(?=\s|$))/i.test(text)) return null;

    const cleanLine = line => line
        .replace(/#букет_?дня(?:_ветка)?(?=\s|$)/gi, '')
        .replace(/(?:^|\s)букет\s+дня(?=\s|$)\s*[:—-]?/gi, '')
        .replace(/^[^\p{L}\p{N}]+/u, '')
        .trim();
    const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
    const pricePattern = /(?:от\s*)?\d[\d\s]*\s*(?:₽|руб(?:\.|лей)?)/gi;
    const oldPriceMatch = text.match(/старая\s+цена\s*[:—-]?\s*((?:от\s*)?\d[\d\s]*\s*(?:₽|руб(?:\.|лей)?))/i);
    const newPriceMatch = text.match(/новая\s+цена\s*[:—-]?\s*((?:от\s*)?\d[\d\s]*\s*(?:₽|руб(?:\.|лей)?))/i);
    const allPrices = Array.from(text.matchAll(pricePattern), match => match[0]);
    const price = (newPriceMatch?.[1] || allPrices.at(-1) || '').replace(/\s+/g, ' ').trim();
    const oldPrice = (oldPriceMatch?.[1] || '').replace(/\s+/g, ' ').trim();
    const numericPrice = Number(price.replace(/\D/g, ''));
    const numericOldPrice = Number(oldPrice.replace(/\D/g, ''));
    const discountPercent = numericOldPrice > numericPrice && numericPrice > 0
        ? Math.round((1 - numericPrice / numericOldPrice) * 100)
        : null;
    const contentLines = lines.filter(line => !/(?:старая|новая)\s+цена/i.test(line) && !/(?:от\s*)?\d[\d\s]*\s*(?:₽|руб(?:\.|лей)?)/i.test(line));
    const availabilityLine = contentLines.find(line => /(?:букет|композици\p{L}*)\s+в\s+наличии/iu.test(line));
    const firstContentLine = contentLines.find(line => line !== availabilityLine);
    const defaultTitle = /композици/i.test(availabilityLine || '') ? 'Композиция дня' : 'Букет дня';

    return {
        title: (firstContentLine || defaultTitle).replace(/^[:—~\-\s]+|[:—~\-\s]+$/g, '').trim().slice(0, 120),
        description: (availabilityLine || contentLines.filter(line => line !== firstContentLine).join(' '))
            .replace(/^[^\p{L}\p{N}]+/u, '')
            .trim()
            .slice(0, 500),
        price: price.slice(0, 60),
        oldPrice: oldPrice.slice(0, 60),
        discountPercent,
    };
}

export async function readLatestPublicBouquet() {
    const channel = String(process.env.TELEGRAM_CHANNEL_ID || '@vetka_2024').replace(/^@/, '').trim();
    if (!channel) return null;

    const response = await fetch(`https://t.me/s/${encodeURIComponent(channel)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VetkaBouquetBot/1.0)' },
    });
    if (!response.ok) return null;

    const page = await response.text();
    const markers = [...page.matchAll(/data-post="[^"/]+\/(\d+)"/g)];
    for (let index = markers.length - 1; index >= 0; index -= 1) {
        const marker = markers[index];
        const start = marker.index;
        const end = index + 1 < markers.length ? markers[index + 1].index : page.length;
        const postHtml = page.slice(start, end);
        const captionHtml = postHtml.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '';
        const parsed = parsePublicBouquetText(textFromTelegramHtml(captionHtml));
        if (!parsed) continue;

        const photos = [...postHtml.matchAll(/background-image:url\('?(https:\/\/cdn\d+\.telesco\.pe\/file\/[^')]+)'?\)/gi)]
            .map(match => match[1]);
        const photoUrl = photos.find(url => /\.(?:jpe?g|png|webp)(?:$|\?)/i.test(url)) || photos[0] || null;
        if (!photoUrl) continue;

        const publishedAt = postHtml.match(/datetime="([^"]+)"/i)?.[1] || new Date().toISOString();
        return {
            ...parsed,
            photoUrl,
            messageId: Number(marker[1]),
            sourcePostUrl: `https://t.me/${channel}/${marker[1]}`,
            publishedAt,
            updatedAt: new Date().toISOString(),
        };
    }

    return null;
}

export function getTelegramWebhookSecret() {
    if (process.env.TELEGRAM_WEBHOOK_SECRET) return process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!process.env.BOT_TOKEN) return null;
    return createHash('sha256')
        .update(`${process.env.BOT_TOKEN}:vetka-bouquet-day`)
        .digest('hex');
}

export function getRedis() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    return new Redis({ url, token });
}

export async function readBouquetDay(redis = getRedis()) {
    if (!redis) return null;
    const value = await redis.get(BOUQUET_DAY_KEY);
    if (!value) return null;
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return null; }
    }
    return value;
}

export function publicBouquetDay(bouquet) {
    if (!bouquet) return null;
    return {
        title: bouquet.title,
        description: bouquet.description,
        price: bouquet.price,
        oldPrice: bouquet.oldPrice || '',
        discountPercent: Number(bouquet.discountPercent) || null,
        photoUrl: bouquet.photoFileId
            ? `/api/telegram-photo?file_id=${encodeURIComponent(bouquet.photoFileId)}`
            : (bouquet.photoUrl ? `/api/telegram-photo?public_url=${encodeURIComponent(bouquet.photoUrl)}` : null),
        sourcePostUrl: bouquet.sourcePostUrl,
        publishedAt: bouquet.publishedAt,
    };
}
