import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';

export const BOUQUET_DAY_KEY = 'vetka:bouquet-day:current';

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
        photoUrl: bouquet.photoFileId
            ? `/api/telegram-photo?file_id=${encodeURIComponent(bouquet.photoFileId)}`
            : (bouquet.photoUrl || null),
        sourcePostUrl: bouquet.sourcePostUrl,
        publishedAt: bouquet.publishedAt,
    };
}
