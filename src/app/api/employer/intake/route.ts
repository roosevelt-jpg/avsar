import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalisePhone } from '@/lib/leads/phone';
import { emailStaff, notifyStaff } from '@/lib/notifications/staff';
import { log, requestIdOf } from '@/lib/observability/log';
import { anonymousActor, withIdempotency } from '@/lib/security/idempotency';
import { clientIp, rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { TURNSTILE_HEADER, verifyTurnstile } from '@/lib/security/turnstile';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

const schema = z
  .object({
    companyName: z.string().trim().min(1).max(160),
    industry: z.string().trim().max(120).optional().or(z.literal('')),
    country: z.string().trim().max(80).optional().or(z.literal('')),
    city: z.string().trim().max(120).optional().or(z.literal('')),
    website: z.string().trim().max(300).optional().or(z.literal('')),
    companySize: z.string().trim().max(80).optional().or(z.literal('')),
    fullName: z.string().trim().min(1).max(120),
    jobTitle: z.string().trim().max(120).optional().or(z.literal('')),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().max(32).optional().or(z.literal('')),
    whatsappOk: z.boolean().default(false),
    roleTitle: z.string().trim().max(160).optional().or(z.literal('')),
    openings: z.number().int().min(1).max(500).nullable().optional(),
    roleCity: z.string().trim().max(120).optional().or(z.literal('')),
    employmentType: z.string().trim().max(40).optional().or(z.literal('')),
    timeline: z.string().trim().max(120).optional().or(z.literal('')),
    notes: z.string().trim().max(4000).optional().or(z.literal('')),
    locale: z.string().max(8).optional(),
  })
  .strict();

/**
 * Multi-step employer registration at /employers/register.
 *
 * Writes a structured intake row and a leads inbox row so recruiters see the
 * enquiry without giving the submitter a portal account. Identity and fee
 * never come from the body.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await rateLimit(RATE_LIMITS.employerIntake, ip);
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

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'not_configured', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }

  return withIdempotency(request, 'employer.intake', anonymousActor(ip), async () => {
    const admin = getAdminSupabase();
    if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

    const summary = [
      `Company: ${input.companyName}`,
      input.industry ? `Industry: ${input.industry}` : null,
      input.country ? `Country: ${input.country}` : null,
      input.city ? `City: ${input.city}` : null,
      input.companySize ? `Size: ${input.companySize}` : null,
      input.website ? `Website: ${input.website}` : null,
      input.jobTitle ? `Contact title: ${input.jobTitle}` : null,
      input.roleTitle ? `Role: ${input.roleTitle}` : null,
      input.openings != null ? `Openings: ${input.openings}` : null,
      input.roleCity ? `Role city: ${input.roleCity}` : null,
      input.employmentType ? `Employment: ${input.employmentType}` : null,
      input.timeline ? `Timeline: ${input.timeline}` : null,
      input.notes ? `Notes: ${input.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const { data: lead, error: leadError } = await admin
      .from('leads')
      .insert({
        kind: 'contact',
        topic: 'employer',
        full_name: input.fullName,
        email: input.email,
        phone,
        whatsapp_ok: Boolean(phone) && input.whatsappOk,
        message: summary.slice(0, 4000),
        company: input.companyName,
        position: input.roleTitle || null,
        city: input.roleCity || input.city || null,
        openings: input.openings ?? null,
        source: 'employer_registration',
        locale: input.locale ?? null,
      })
      .select('id')
      .single();

    if (leadError || !lead) {
      log.error('employer_intake.lead_failed', { requestId: requestIdOf(request), error: leadError?.message });
      return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    }

    const { data: intake, error: intakeError } = await admin
      .from('employer_intake_submissions')
      .insert({
        company_name: input.companyName,
        industry: input.industry || null,
        country: input.country || null,
        city: input.city || null,
        website: input.website || null,
        company_size: input.companySize || null,
        contact_full_name: input.fullName,
        contact_job_title: input.jobTitle || null,
        contact_email: input.email,
        contact_phone: phone,
        whatsapp_ok: Boolean(phone) && input.whatsappOk,
        role_title: input.roleTitle || null,
        openings: input.openings ?? null,
        role_city: input.roleCity || null,
        employment_type: input.employmentType || null,
        timeline: input.timeline || null,
        notes: input.notes || null,
        locale: input.locale ?? null,
        lead_id: lead.id,
      })
      .select('id')
      .single();

    if (intakeError || !intake) {
      log.error('employer_intake.insert_failed', { requestId: requestIdOf(request), error: intakeError?.message });
      /* Lead already exists; staff can still work from the inbox. */
    }

    const title = `Employer registration: ${input.companyName}`;
    await notifyStaff({
      permission: 'leads.manage',
      kind: 'lead.employer',
      title,
      body: (input.roleTitle || input.notes || summary).slice(0, 160),
      href: `/admin/inbox/${lead.id}`,
    });
    await emailStaff({
      subject: title,
      line: summary.slice(0, 280),
      href: `/admin/inbox/${lead.id}`,
      actionLabel: 'Open in inbox',
    });

    return NextResponse.json({ ok: true, id: intake?.id ?? lead.id, leadId: lead.id });
  });
}
