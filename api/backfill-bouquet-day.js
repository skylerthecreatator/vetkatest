import { BOUQUET_DAY_KEY, getRedis } from '../lib/bouquet-day.js';
import { parseBouquetPost } from './telegram-webhook.js';

function decodeHtml(value) {
    return value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const redis = getRedis();
    if (!redis) return res.status(503).json({ ok: false, error: 'storage_not_configured' });

    try {
        const sourcePostUrl = 'https://t.me/vetka_2024/1740';
        const response = await fetch(`${sourcePostUrl}?embed=1&mode=tme`);
        if (!response.ok) return res.status(502).json({ ok: false, error: 'telegram_post_unavailable' });
        const html = await response.text();
        const photoUrl = html.match(/tgme_widget_message_photo_wrap[^>]*background-image:url\('([^']+)'\)/i)?.[1];
        const captionHtml = html.match(/<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div><\/div><div class="media_not_supported_cont">/i)?.[1];
        if (!photoUrl || !captionHtml) return res.status(502).json({ ok: false, error: 'telegram_post_parse_failed' });

        const parsed = parseBouquetPost({ caption: decodeHtml(captionHtml) });
        if (!parsed) return res.status(422).json({ ok: false, error: 'bouquet_tag_not_found' });

        const record = {
            ...parsed,
            photoUrl,
            sourcePostUrl,
            channelId: -2295970147,
            messageId: 1740,
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await redis.set(BOUQUET_DAY_KEY, JSON.stringify(record));
        return res.status(200).json({
            ok: true,
            bouquet: {
                title: record.title,
                oldPrice: record.oldPrice,
                price: record.price,
                discountPercent: record.discountPercent,
                sourcePostUrl,
            },
        });
    } catch (error) {
        console.error('Bouquet day backfill failed:', error);
        return res.status(502).json({ ok: false, error: 'backfill_failed' });
    }
}
