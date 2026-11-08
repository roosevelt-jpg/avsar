import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate } from '@/lib/auth';
import { normalisePhone } from '@/lib/leads/phone';
import { LEAD_TOPIC_LABELS } from '@/lib/leads/types';
import { emailStaff, notifyStaff } from '@/lib/notifications/staff';
import { log, requestIdOf } from '@/lib/observability/log';
import { anonymousActor, withIdempotency } from '@/lib/security/idempotency';
import { clientIp, rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { TURNSTILE_HEADER, verifyTurnstile } from '@/lib/security/turnstile';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { attachLeads, findSamePerson } from '@/lib/console/same-person';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

const schema = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(254).optional().or(z.literal('')),
    phone: z.string().trim().max(32).optional().or(z.literal('')),
    city: z.string().trim().max(120).optional().or(z.literal('')),
    whatsappOk: z.boolean().default(false),
    topic: z.enum(['candidate', 'employer']),
    note: z.string().trim().max(500).optional().or(z.literal('')),
    locale: z.string().max(8).optional(),
  })
  .strict();

/**
 * First-visit shopfront popup. Creates a CRM lead (inbox) so recruiters see
 * new site visitors who left a name and a way to reply. Challenged and rate
 * limited like the contact form; identity never comes from the body.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await rateLimit(RATE_LIMITS.contact, ip);
  if (!limited.ok) return rateLimitedResponse(limited);

  if (!(await verifyTurnstile(request.headers.get(TURNSTILE_HEADER), ip))) {
    return NextResponse.json({ error: 'challenge_failed' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  const input = parsed.data;

  const phone = input.phone ? normalisePhone(input.phone) : null;
  if (input.phone && !phone) {
    return NextResponse.json({ error: 'validation_failed', issues: { phone: ['invalid_phone'] } }, { status: 422 });
  }
  if (!phone && !input.email) {
    return NextResponse.json({ error: 'validation_failed', issues: { email: ['email_or_phone'] } }, { status: 422 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  return withIdempotency(request, 'leads.visitor', anonymousActor(ip), async () => {
    const admin = getAdminSupabase();
    if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

    const candidate = await getSessionCandidate();
    const note = input.note?.trim();
    const message = note
      ? `First-visit popup. ${note}`
      : 'First-visit popup — visitor left their details to hear from us.';

    const { data, error } = await admin
      .from('leads')
      .insert({
        kind: 'contact',
        topic: input.topic,
        full_name: input.fullName,
        email: input.email || null,
        phone,
        whatsapp_ok: Boolean(phone) && input.whatsappOk,
        message,
        city: input.city || null,
        source: 'visitor_popup',
        locale: input.locale ?? null,
        candidate_id: candidate?.id ?? null,
      })
      .select('id')
      .single();

    if (error || !data) {
      log.error('leads.visitor.insert_failed', { requestId: requestIdOf(request), error: error?.message });
      return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    }

    const knownId = candidate?.id ?? (await findSamePerson({ email: input.email, phone })).candidate?.id ?? null;
    if (knownId) await attachLeads({ candidateId: knownId, email: input.email, phone });

    const title = `Site visitor: ${LEAD_TOPIC_LABELS[input.topic]} · ${input.fullName}`;
    await notifyStaff({
      permission: 'leads.manage',
      kind: 'lead.visitor_popup',
      title,
      body: message.slice(0, 160),
      href: `/admin/inbox/${data.id}`,
    });
    await emailStaff({
      subject: title,
      line: message.slice(0, 280),
      href: `/admin/inbox/${data.id}`,
      actionLabel: 'Open in inbox',
      origin: new URL(request.url).origin,
    });

    return NextResponse.json({ status: 'received', id: data.id }, { status: 201 });
  });
}
