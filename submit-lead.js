// /api/submit-lead.js
// Vercel Serverless Function. Принимает заявку с формы сайта ВЕТКА,
// отправляет её флористу в Telegram и сохраняет копию в Upstash Redis.
//
// Нужные переменные окружения (Vercel → Settings → Environment Variables):
//   BOT_TOKEN  — токен бота от @BotFather
//   CHAT_ID    — куда слать (личный чат/группа/канал), см. инструкцию в чате
//   (KV_REST_API_URL и KV_REST_API_TOKEN добавятся сами,
//    когда подключишь Upstash через Vercel Marketplace → Storage)
//
// Нужная зависимость в package.json: "@upstash/redis"
//   npm install @upstash/redis

import { Redis } from '@upstash/redis';

// Интеграция "Upstash for Redis" через Vercel Marketplace создаёт переменные
// с префиксом KV_ (для обратной совместимости с бывшим Vercel KV), а не UPSTASH_,
// поэтому подключаемся по этим именам напрямую, а не через Redis.fromEnv().
//
// Оборачиваем создание клиента в try/catch: если переменные окружения не настроены
// или указаны неверно, функция не должна падать целиком — отправка в Telegram
// (главное, ради чего всё это) обязана работать даже без Redis.
let redis = null;
try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        redis = new Redis({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
        });
    } else {
        console.error('KV_REST_API_URL / KV_REST_API_TOKEN не заданы — Redis отключён, работаем без него');
    }
} catch (err) {
    console.error('Не удалось создать клиент Redis:', err);
    redis = null;
}

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

    // Rate-limit по номеру телефона через Upstash Redis (если он вообще доступен)
    if (redis) {
        try {
            const rateLimitKey = `ratelimit:${cleanPhone}`;
            const recent = await redis.get(rateLimitKey);
            if (recent) {
                return res.status(429).json({ ok: false, error: 'too_many_requests' });
            }
            await redis.set(rateLimitKey, Date.now(), { ex: RATE_LIMIT_SECONDS });
        } catch (err) {
            // Если Redis недоступен — не блокируем заявку из-за инфраструктурной проблемы,
            // просто логируем и едем дальше без rate-limit на этот раз.
            console.error('Redis rate-limit check failed:', err);
        }
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

    // Сохраняем копию заявки в Upstash Redis (если он доступен) — история для вас,
    // не зависит от переписки в Telegram
    if (redis) {
        try {
            const leadKey = `lead:${Date.now()}:${cleanPhone}`;
            await redis.set(leadKey, JSON.stringify({
                name: cleanName,
                phone: cleanPhone,
                messenger,
                source,
                sourceDetail,
                comment,
                createdAt: new Date().toISOString(),
            }));
        } catch (err) {
            // Заявка уже улетела флористу в Telegram — это главное. Проблема с записью в Redis не должна
            // приводить к ошибке для пользователя, просто логируем.
            console.error('Redis lead save failed:', err);
        }
    }

    return res.status(200).json({ ok: true });
}
