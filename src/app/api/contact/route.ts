import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate } from '@/lib/auth';
import { normalisePhone } from '@/lib/leads/phone';
import { LEAD_TOPIC_LABELS } from '@/lib/leads/types';
import { notifyStaff } from '@/lib/notifications/staff';
import { log, requestIdOf } from '@/lib/observability/log';
import { anonymousActor, withIdempotency } from '@/lib/security/idempotency';
import { clientIp, rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { TURNSTILE_HEADER, verifyTurnstile } from '@/lib/security/turnstile';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

const schema = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(254).optional().or(z.literal('')),
    phone: z.string().trim().max(32).optional().or(z.literal('')),
    whatsappOk: z.boolean().default(false),
    topic: z.enum(['candidate', 'employer', 'scam_report', 'other']),
    message: z.string().trim().min(1).max(4000),
    company: z.string().trim().max(160).optional().or(z.literal('')),
    position: z.string().trim().max(120).optional().or(z.literal('')),
    city: z.string().trim().max(120).optional().or(z.literal('')),
    openings: z.number().int().min(1).max(500).nullable().optional(),
    source: z.enum(['contact_form', 'employers_page']).default('contact_form'),
    locale: z.string().max(8).optional(),
  })
  .strict();

/**
 * A message to us, from anyone, into the staff inbox.
 *
 * The contact page used to be a list of email addresses. Mail to a shared
 * mailbox has no owner and no status, and a report that someone is charging
 * candidates in our name deserves better than sitting unread. Each message
 * becomes a lead a recruiter can pick up, answer and close.
 *
 * Anonymous by design, so it is challenged and rate limited before anything is
 * written, and a fee report needs neither a name that is real nor an account.
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
  /* Someone who leaves neither cannot be answered, and a fee report with no
     way back is still worth having, so only questions need a way back. */
  if (!phone && !input.email && input.topic !== 'scam_report') {
    return NextResponse.json({ error: 'validation_failed', issues: { email: ['email_or_phone'] } }, { status: 422 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'demo_mode', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }

  return withIdempotency(request, 'contact', anonymousActor(ip), async () => {
    const admin = getAdminSupabase();
    if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

    const candidate = await getSessionCandidate();
    const { data, error } = await admin
      .from('leads')
      .insert({
        kind: 'contact',
        topic: input.topic,
        full_name: input.fullName,
        email: input.email || null,
        phone,
        whatsapp_ok: Boolean(phone) && input.whatsappOk,
        message: input.message,
        company: input.company || null,
        position: input.position || null,
        city: input.city || null,
        openings: input.openings ?? null,
        source: input.source,
        locale: input.locale ?? null,
        candidate_id: candidate?.id ?? null,
      })
      .select('id')
      .single();

    if (error || !data) {
      log.error('contact.insert_failed', { requestId: requestIdOf(request), error: error?.message });
      return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    }

    await notifyStaff({
      permission: 'leads.manage',
      kind: `lead.${input.topic}`,
      title: `${LEAD_TOPIC_LABELS[input.topic]}: ${input.company || input.fullName}`,
      body: input.message.slice(0, 160),
      href: `/admin/inbox/${data.id}`,
    });

    return NextResponse.json({ status: 'received' }, { status: 201 });
  });
}
