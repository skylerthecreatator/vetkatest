import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import submitLead from './api/submit-lead.js';
import bouquetDay from './api/bouquet-day.js';
import telegramPhoto from './api/telegram-photo.js';
import telegramWebhook from './api/telegram-webhook.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));

function serverless(handler) {
    return async (req, res, next) => {
        try {
            await handler(req, res);
        } catch (error) {
            next(error);
        }
    };
}

app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
app.all('/api/submit-lead', serverless(submitLead));
app.all('/api/bouquet-day', serverless(bouquetDay));
app.all('/api/telegram-photo', serverless(telegramPhoto));
app.all('/api/telegram-webhook', serverless(telegramWebhook));

app.use(express.static(dirname, {
    index: false,
    maxAge: '1h',
    setHeaders(res, filePath) {
        if (/\.(?:html|xml|txt)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    },
}));

app.get('/', (_req, res) => res.sendFile(path.join(dirname, 'index.html')));
app.use((_req, res) => res.status(404).sendFile(path.join(dirname, '404.html'), error => {
    if (error) res.status(404).type('text').send('Not found');
}));
app.use((error, _req, res, _next) => {
    console.error(error);
    if (!res.headersSent) res.status(500).json({ ok: false, error: 'server_error' });
});

app.listen(port, '127.0.0.1', () => {
    console.log(`Vetka server is listening on http://127.0.0.1:${port}`);
});
