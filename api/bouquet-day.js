import { getRedis, publicBouquetDay, readBouquetDay, readLatestPublicBouquet } from '../lib/bouquet-day.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    try {
        const storedBouquet = await readBouquetDay();
        const publicBouquet = await readLatestPublicBouquet().catch(() => null);
        const shouldUsePublicBouquet = publicBouquet
            && (!storedBouquet || Number(publicBouquet.messageId || 0) > Number(storedBouquet.messageId || 0));
        const bouquet = shouldUsePublicBouquet ? publicBouquet : storedBouquet;

        if (shouldUsePublicBouquet) {
            getRedis()?.set('vetka:bouquet-day:current', JSON.stringify(publicBouquet)).catch(error => {
                console.error('Bouquet day public fallback save failed:', error);
            });
        }
        res.setHeader('Cache-Control', 'private, no-store, max-age=0');
        return res.status(200).json({ ok: true, bouquet: publicBouquetDay(bouquet) });
    } catch (error) {
        console.error('Bouquet day read failed:', error);
        return res.status(503).json({ ok: false, error: 'bouquet_unavailable' });
    }
}
