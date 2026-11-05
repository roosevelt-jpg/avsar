import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { answerQuestion } from '@/lib/assistant/reply';
import { refreshIntegrations } from '@/lib/integrations/runtime';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sendWhatsAppText } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Inbound WhatsApp.
 *
 * Meta Cloud API: GET verify + POST with X-Hub-Signature-256.
 * Green API (`WHATSAPP_PROVIDER=green`): POST with `Authorization: Bearer
 * GREEN_WEBHOOK_TOKEN` (or `?token=`), body shaped like Green incomingMessage.
 *
 * Replies use the same company notes as the website assistant.
 */
export async function GET(request: Request) {
  await refreshIntegrations();
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('forbidden', { status: 403 });
}

export async function POST(request: Request) {
  await refreshIntegrations();
  const provider = (process.env.WHATSAPP_PROVIDER ?? 'meta').trim().toLowerCase();
  const raw = await request.text();

  if (provider === 'green') {
    if (!greenAuthorized(request)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return handleGreen(raw);
  }

  if (!signed(raw, request.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return handleMeta(raw);
}

async function handleMeta(raw: string) {
  const payload = JSON.parse(raw) as {
    entry?: { changes?: { value?: { messages?: { id?: string; from?: string; type?: string; text?: { body?: string } }[] } }[] }[];
  };

  const admin = getAdminSupabase();
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        const text = message.type === 'text' ? message.text?.body?.trim() : '';
        const from = message.from ?? '';
        const id = message.id ?? '';
        if (!text || !from || !id || !admin) continue;
        const { data: seen } = await admin.from('assistant_messages').select('id').eq('external_id', id).maybeSingle();
        if (seen) continue;
        const result = await answerQuestion({
          question: text,
          threadKey: from.replace(/[^\d]/g, '').slice(0, 80),
          channel: 'whatsapp',
          externalId: id,
        });
        await sendWhatsAppText(from, result.reply);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleGreen(raw: string) {
  const payload = JSON.parse(raw) as {
    typeWebhook?: string;
    idMessage?: string;
    senderData?: { sender?: string; chatId?: string };
    messageData?: {
      typeMessage?: string;
      textMessageData?: { textMessage?: string };
      extendedTextMessageData?: { text?: string };
    };
  };

  if (payload.typeWebhook && payload.typeWebhook !== 'incomingMessageReceived') {
    return NextResponse.json({ ok: true, ignored: payload.typeWebhook });
  }

  const text =
    payload.messageData?.textMessageData?.textMessage?.trim() ||
    payload.messageData?.extendedTextMessageData?.text?.trim() ||
    '';
  const from =
    payload.senderData?.sender?.replace(/@c\.us$/i, '') ||
    payload.senderData?.chatId?.replace(/@c\.us$/i, '') ||
    '';
  const id = payload.idMessage ?? '';
  const admin = getAdminSupabase();
  if (!text || !from || !id || !admin) return NextResponse.json({ ok: true });

  const { data: seen } = await admin.from('assistant_messages').select('id').eq('external_id', id).maybeSingle();
  if (seen) return NextResponse.json({ ok: true, duplicate: true });

  const result = await answerQuestion({
    question: text,
    threadKey: from.replace(/[^\d]/g, '').slice(0, 80),
    channel: 'whatsapp',
    externalId: id,
  });
  await sendWhatsAppText(from, result.reply);
  return NextResponse.json({ ok: true });
}

function greenAuthorized(request: Request): boolean {
  /* Prefer a dedicated webhook secret; otherwise reuse apiTokenInstance (GREEN_API_TOKEN).
     Green has no Meta-style hub.verify_token — this is the inbound auth instead. */
  const expected =
    process.env.GREEN_WEBHOOK_TOKEN?.trim() || process.env.GREEN_API_TOKEN?.trim() || '';
  if (!expected) return false;
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  const query = new URL(request.url).searchParams.get('token')?.trim() ?? '';
  const given = bearer || query || request.headers.get('x-green-webhook-token')?.trim() || '';
  if (!given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signed(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const given = header.slice('sha256='.length);
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
