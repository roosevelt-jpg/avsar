import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { answerQuestion } from '@/lib/assistant/reply';
import { refreshIntegrations } from '@/lib/integrations/runtime';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sendWhatsAppText } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Inbound WhatsApp. Meta calls this when someone writes to the company number.
 *
 * The verify token and the app secret come from Settings › Integrations.
 * A message that fails the signature is ignored. The reply uses the same
 * notes as the website, then goes back as ordinary text inside Meta's
 * 24-hour window.
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
  const raw = await request.text();
  if (!signed(raw, request.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

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

function signed(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const given = header.slice('sha256='.length);
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
