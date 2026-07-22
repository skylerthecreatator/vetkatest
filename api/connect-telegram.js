import { getRedis, getTelegramWebhookSecret } from '../lib/bouquet-day.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const botToken = process.env.BOT_TOKEN;
    const secret = getTelegramWebhookSecret();
    if (!botToken || !secret) {
        return res.status(503).json({ ok: false, error: 'bot_not_configured' });
    }

    const webhookUrl = 'https://vetkatest.vercel.app/api/telegram-webhook';
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                secret_token: secret,
                allowed_updates: ['channel_post', 'edited_channel_post'],
                drop_pending_updates: false,
            }),
        });
        const result = await response.json();
        if (!result.ok) {
            console.error('Telegram webhook setup failed:', result.description);
            return res.status(502).json({ ok: false, error: 'telegram_setup_failed' });
        }

        return res.status(200).json({
            ok: true,
            webhookUrl,
            storageConfigured: Boolean(getRedis()),
        });
    } catch (error) {
        console.error('Telegram webhook setup request failed:', error);
        return res.status(502).json({ ok: false, error: 'telegram_unreachable' });
    }
}
