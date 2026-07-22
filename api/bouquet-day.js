import { publicBouquetDay, readBouquetDay } from '../lib/bouquet-day.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    try {
        const bouquet = await readBouquetDay();
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        return res.status(200).json({ ok: true, bouquet: publicBouquetDay(bouquet) });
    } catch (error) {
        console.error('Bouquet day read failed:', error);
        return res.status(503).json({ ok: false, error: 'bouquet_unavailable' });
    }
}
