const token = process.env.BOT_TOKEN;
const siteUrl = String(process.env.SITE_URL || '').replace(/\/$/, '');
const { createHash } = await import('node:crypto');
const secret = process.env.TELEGRAM_WEBHOOK_SECRET || (token
    ? createHash('sha256').update(`${token}:vetka-bouquet-day`).digest('hex')
    : '');

if (!token || !siteUrl || !secret) {
    console.error('Нужны BOT_TOKEN, SITE_URL и TELEGRAM_WEBHOOK_SECRET.');
    process.exit(1);
}

const webhookUrl = `${siteUrl}/api/telegram-webhook`;
const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
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
    console.error('Telegram не принял webhook:', result.description || result);
    process.exit(1);
}

console.log(`Webhook подключён: ${webhookUrl}`);
