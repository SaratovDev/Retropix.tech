import type { APIRoute } from 'astro';
import { rateLimit } from '../../lib/rate-limit';

export const prerender = false;

interface LeadPayload {
  name: string;
  contact: string;
  method: 'telegram' | 'phone' | 'max' | string;
  message?: string;
  source?: string;
  discount?: string;
  level?: string;
  type?: string;
  email?: string;
  // Honeypot — должно быть пустым. Боты заполняют.
  website?: string;
}

const METHOD_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  phone: 'Телефон',
  max: 'MAX',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // === 1. Rate limiting ===
    const ip = getClientIp(request);
    const rl = rateLimit(`lead:${ip}`, { max: 5, windowMs: 10 * 60 * 1000 });

    if (!rl.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Слишком много заявок. Попробуйте через 10 минут.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const data = (await request.json()) as LeadPayload;

    // === 2. Honeypot: если поле заполнено — это бот ===
    // Отвечаем 200, чтобы бот не понял, что его раскусили.
    if (data.website && data.website.trim() !== '') {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // === 3. Валидация ===
    if (!data.name || !data.contact) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Не заполнены обязательные поля' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // === 4. Dev-режим: отправка выключена ===
    if (import.meta.env.LEAD_ENABLED !== 'true') {
      console.log('[Lead] Отправка выключена (LEAD_ENABLED !== "true"). Payload:', data);
      return new Response(JSON.stringify({ ok: true, dev: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resendKey = import.meta.env.RESEND_API_KEY;
    const toEmail = import.meta.env.LEAD_TO_EMAIL;
    const fromEmail = import.meta.env.LEAD_FROM_EMAIL || 'onboarding@resend.dev';

    if (!resendKey || !toEmail) {
      console.error('RESEND_API_KEY или LEAD_TO_EMAIL не заданы');
      return new Response(
        JSON.stringify({ ok: false, error: 'Сервер не настроен' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // === 5. Формируем письмо ===
    const methodLabel = METHOD_LABELS[data.method] ?? data.method;
    const sourceLabel = data.source ?? '—';

    const rows: string[] = [
      `<tr><td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee">Имя</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(data.name)}</td></tr>`,
      `<tr><td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee">Способ связи</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(methodLabel)}</td></tr>`,
      `<tr><td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee">Контакт</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(data.contact)}</td></tr>`,
      `<tr><td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee">Источник</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(sourceLabel)}</td></tr>`,
    ];

    if (data.message) {
      rows.push(
        `<tr><td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee">Сообщение</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(data.message)}</td></tr>`
      );
    }
    if (data.discount) {
      rows.push(
        `<tr><td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee">Скидка</td><td style="padding:6px 12px;border-bottom:1px solid #eee">−${escapeHtml(data.discount)}%</td></tr>`
      );
    }
    if (data.level) {
      rows.push(
        `<tr><td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee">Уровень</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(data.level)}</td></tr>`
      );
    }
    if (data.type) {
      rows.push(
        `<tr><td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee">Тип заявки</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(data.type)}</td></tr>`
      );
    }
    if (data.email) {
      rows.push(
        `<tr><td style="padding:6px 12px;font-weight:bold;border-bottom:1px solid #eee">Email</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(data.email)}</td></tr>`
      );
    }

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#F36223;margin:0 0 16px">🔔 Новая заявка</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows.join('')}</table>
        <p style="color:#888;font-size:12px;margin-top:24px">${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</p>
      </div>
    `;

    const text = [
      'Новая заявка',
      '',
      `Имя: ${data.name}`,
      `Связь: ${methodLabel} — ${data.contact}`,
      `Источник: ${sourceLabel}`,
      data.message ? `Сообщение: ${data.message}` : '',
      data.discount ? `Скидка: −${data.discount}%` : '',
      data.level ? `Уровень: ${data.level}` : '',
      data.type ? `Тип: ${data.type}` : '',
      data.email ? `Email: ${data.email}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    // === 6. Отправка через Resend ===
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Web Design Guru <${fromEmail}>`,
        to: [toEmail],
        subject: `Новая заявка: ${data.name}`,
        html,
        text,
      }),
    });

    const result = await res.json();

    if (import.meta.env.DEV) {
      console.log('Resend response:', res.status, result);
    }

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: result.message ?? 'Не удалось отправить заявку',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Lead API error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Внутренняя ошибка' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};