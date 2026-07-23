import { readBouquetDay } from '../lib/bouquet-day.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end();
    }

    const requestedFileId = String(req.query?.file_id || '');
    const publicUrl = String(req.query?.public_url || '');
    const validPublicUrl = /^https:\/\/cdn\d+\.telesco\.pe\/file\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9]+)?$/i.test(publicUrl);
    if ((!requestedFileId && !publicUrl) || requestedFileId.length > 300 || (publicUrl && !validPublicUrl)) return res.status(400).end();

    try {
        let photoResponse;
        if (publicUrl) {
            photoResponse = await fetch(publicUrl);
        } else {
            const bouquet = await readBouquetDay();
            if (!bouquet?.photoFileId || bouquet.photoFileId !== requestedFileId) {
                return res.status(404).end();
            }

            const botToken = process.env.BOT_TOKEN;
            if (!botToken) return res.status(503).end();
            const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(requestedFileId)}`);
            const fileData = await fileResponse.json();
            if (!fileData.ok || !fileData.result?.file_path) return res.status(502).end();
            photoResponse = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`);
        }
        if (!photoResponse.ok) return res.status(502).end();

        const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';
        const bytes = Buffer.from(await photoResponse.arrayBuffer());
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).send(bytes);
    } catch (error) {
        console.error('Telegram photo proxy failed:', error);
        return res.status(503).end();
    }
}
