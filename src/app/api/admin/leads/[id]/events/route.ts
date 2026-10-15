import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { getMailer } from '@/lib/email';
import { composeEmail } from '@/lib/email/compose';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isWhatsAppConfigured, sendWhatsAppToNumber } from '@/lib/whatsapp';

export const runtime = 'nodejs';

const schema = z
  .object({
    kind: z.enum(['note', 'email', 'whatsapp']),
    body: z.string().trim().min(1).max(4000),
  })
  .strict();

/**
 * Answer a lead, or leave a note on it.
 *
 * An email goes from the platform with replies directed to the support inbox,
 * so the conversation continues with a person. WhatsApp uses the approved
 * `lead_follow_up` template, because Meta will not deliver free text to
 * someone who has not messaged us in the last day; the recruiter's line fills
 * its one free parameter. Either way the exact text is kept on the lead, so
 * the next person to pick it up can see what was promised.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('leads.manage');
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const { kind, body } = parsed.data;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: lead } = await admin
    .from('leads')
    .select('id, status, full_name, email, phone, whatsapp_ok')
    .eq('id', id)
    .maybeSingle();
  if (!lead) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const firstName = String(lead.full_name).split(/\s+/)[0] ?? '';

  if (kind === 'email') {
    if (!lead.email) return NextResponse.json({ error: 'no_email' }, { status: 409 });
    const email = await composeEmail('lead_reply', { first_name: firstName, message: body }, { origin: new URL(request.url).origin });
    const result = await getMailer().send({ to: String(lead.email), ...email });
    if (!result.sent) return NextResponse.json({ error: 'send_failed' }, { status: 502 });
  }

  if (kind === 'whatsapp') {
    if (!lead.phone || !lead.whatsapp_ok) return NextResponse.json({ error: 'no_whatsapp_consent' }, { status: 409 });
    if (!isWhatsAppConfigured()) return NextResponse.json({ error: 'whatsapp_unconfigured' }, { status: 503 });
    const result = await sendWhatsAppToNumber({ to: String(lead.phone), template: 'lead_follow_up', params: [firstName, body] });
    if (!result.sent) return NextResponse.json({ error: 'send_failed' }, { status: 502 });
  }

  const { error } = await admin.from('lead_events').insert({ lead_id: id, kind, body, actor: guard.userId });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  /* Answering is what "replied" means; a note changes nothing for the person. */
  if (kind !== 'note' && (lead.status === 'new' || lead.status === 'open')) {
    await admin.from('lead_events').insert({ lead_id: id, kind: 'status', from_status: lead.status, to_status: 'replied', actor: guard.userId });
    await admin.from('leads').update({ status: 'replied' }).eq('id', id);
  } else if (lead.status === 'new') {
    await admin.from('lead_events').insert({ lead_id: id, kind: 'status', from_status: 'new', to_status: 'open', actor: guard.userId });
    await admin.from('leads').update({ status: 'open' }).eq('id', id);
  }

  await audit(guard.userId, `lead.${kind}`, `lead:${id}`, kind === 'note' ? undefined : { length: body.length });
  return NextResponse.json({ status: 'saved' });
}
