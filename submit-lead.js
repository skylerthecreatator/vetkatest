// /api/submit-lead.js
// Vercel Serverless Function. Принимает заявку с формы сайта ВЕТКА,
// отправляет её флористу в Telegram и сохраняет копию в Vercel KV.
//
// Нужные переменные окружения (Vercel → Settings → Environment Variables):
//   BOT_TOKEN  — токен бота от @BotFather
//   CHAT_ID    — куда слать (личный чат/группа/канал), см. инструкцию в чате
//
// Нужная зависимость в package.json: "@vercel/kv"
//   npm install @vercel/kv
// И подключённое Vercel KV-хранилище к проекту (Storage → Create Database → KV).

import { kv } from '@vercel/kv';

const MESSENGER_LABELS = {
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    max: 'MAX',
    call: 'звонок',
};

// Простая защита от дублей/спама — не даём слать чаще раза в 45 секунд с одного номера
const RATE_LIMIT_SECONDS = 45;

function onlyDigits(str) {
    return (str || '').replace(/\D/g, '');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const {
        name = '',
        phone = '',
        messenger = 'telegram',
        source = 'unknown',
        sourceLabel = '',
        sourceDetail = '',
        comment = '',
        website = '', // honeypot — обычный человек это поле никогда не заполнит
    } = body;

    // Honeypot сработал — скорее всего бот. Тихо отвечаем "успехом", ничего не отправляя и не палимся.
    if (website && website.trim() !== '') {
        return res.status(200).json({ ok: true });
    }

    const cleanName = String(name).trim().slice(0, 100);
    const cleanPhone = onlyDigits(phone);

    if (cleanName.length < 2 || cleanPhone.length < 11) {
        return res.status(400).json({ ok: false, error: 'invalid_input' });
    }

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;
    if (!botToken || !chatId) {
        console.error('BOT_TOKEN or CHAT_ID is not set');
        return res.status(500).json({ ok: false, error: 'server_misconfigured' });
    }

    // Rate-limit по номеру телефона через Vercel KV
    try {
        const rateLimitKey = `ratelimit:${cleanPhone}`;
        const recent = await kv.get(rateLimitKey);
        if (recent) {
            return res.status(429).json({ ok: false, error: 'too_many_requests' });
        }
        await kv.set(rateLimitKey, Date.now(), { ex: RATE_LIMIT_SECONDS });
    } catch (err) {
        // Если KV недоступен — не блокируем заявку из-за инфраструктурной проблемы,
        // просто логируем и едем дальше без rate-limit на этот раз.
        console.error('KV rate-limit check failed:', err);
    }

    const messengerLabel = MESSENGER_LABELS[messenger] || messenger;
    const finalSourceLabel = sourceLabel || source;

    const lines = [
        '🌿 Новая заявка с сайта ВЕТКИ!',
        '',
        `👤 Имя: ${cleanName}`,
        `📞 Телефон: +${cleanPhone}`,
        `💬 Связаться через: ${messengerLabel}`,
        `📍 Источник: ${finalSourceLabel}${sourceDetail ? ` — «${String(sourceDetail).trim().slice(0, 200)}»` : ''}`,
    ];
    if (comment && String(comment).trim()) {
        lines.push(`💭 Комментарий: ${String(comment).trim().slice(0, 500)}`);
    }
    const text = lines.join('\n');

    // Отправляем в Telegram
    try {
        const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text }),
        });
        const tgData = await tgResponse.json();
        if (!tgData.ok) {
            console.error('Telegram API error:', tgData);
            return res.status(502).json({ ok: false, error: 'telegram_send_failed' });
        }
    } catch (err) {
        console.error('Telegram fetch failed:', err);
        return res.status(502).json({ ok: false, error: 'telegram_unreachable' });
    }

    // Сохраняем копию заявки в KV — история для вас, не зависит от переписки в Telegram
    try {
        const leadKey = `lead:${Date.now()}:${cleanPhone}`;
        await kv.set(leadKey, JSON.stringify({
            name: cleanName,
            phone: cleanPhone,
            messenger,
            source,
            sourceDetail,
            comment,
            createdAt: new Date().toISOString(),
        }));
    } catch (err) {
        // Заявка уже улетела флористу в Telegram — это главное. Проблема с записью в KV не должна
        // приводить к ошибке для пользователя, просто логируем.
        console.error('KV lead save failed:', err);
    }

    return res.status(200).json({ ok: true });
}
