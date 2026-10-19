import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionEmployer } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { emailStaff, notifyStaff } from '@/lib/notifications/staff';
import { CEFR_LEVELS, EMPLOYMENT_TYPES, HOUSING_OPTIONS, slugify } from '@/lib/jobs/types';
import { RATE_LIMITS, rateLimit, rateLimitedResponse } from '@/lib/security/rate-limit';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

const optionalInt = (max: number) => z.number().int().min(0).max(max).nullable();

const schema = z
  .object({
    title: z.string().trim().min(3).max(140),
    city: z.string().trim().min(2).max(80),
    region: z.string().trim().max(80).optional().default(''),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    contractMonths: z.number().int().min(1).max(120).nullable(),
    openings: z.number().int().min(1).max(500),
    salaryMinEur: optionalInt(100_000),
    salaryMaxEur: optionalInt(100_000),
    salaryPeriod: z.enum(['hour', 'month', 'year']),
    housing: z.enum(HOUSING_OPTIONS),
    mealsIncluded: z.boolean(),
    minEnglish: z.enum(CEFR_LEVELS).nullable(),
    note: z.string().trim().max(2000).optional().default(''),
  })
  .refine((v) => v.salaryMinEur == null || v.salaryMaxEur == null || v.salaryMaxEur >= v.salaryMinEur, {
    message: 'salary_range',
    path: ['salaryMaxEur'],
  });

/**
 * An employer asks for a vacancy to be posted.
 *
 * The request becomes a draft posting linked to the employer in the session,
 * never one named in the body. Only the fields below are taken from the
 * request; status, featured, images and SEO are the recruiter's to set, and
 * nothing is visible to candidates until a recruiter publishes it.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'not_configured', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }

  const employer = await getSessionEmployer();
  if (!employer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const limited = await rateLimit(RATE_LIMITS.vacancyRequest, employer.userId);
  if (!limited.ok) return rateLimitedResponse(limited);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const input = parsed.data;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  /* A random suffix keeps two requests for the same role in the same city
     apart; the recruiter can tidy the slug before publishing. */
  const base = slugify(`${input.title} ${input.city}`).slice(0, 70).replace(/-+$/, '') || 'vacancy';
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('job_postings')
    .insert({
      slug: `${base}-${randomBytes(2).toString('hex')}`,
      title: input.title,
      employer_id: employer.employerId,
      city: input.city,
      region: input.region || null,
      country: 'PT',
      employment_type: input.employmentType,
      contract_months: input.contractMonths,
      openings: input.openings,
      salary_min_eur: input.salaryMinEur,
      salary_max_eur: input.salaryMaxEur,
      salary_period: input.salaryPeriod,
      housing: input.housing,
      meals_included: input.mealsIncluded,
      min_english: input.minEnglish,
      status: 'draft',
      requested_at: now,
      requested_by: employer.userId,
      request_note: input.note || null,
      created_by: employer.userId,
      updated_by: employer.userId,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[employer] vacancy request failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  await audit(employer.userId, 'vacancy.request', `job:${data.id}`, { employer: employer.employerId });
  await emailStaff({
    subject: `Vacancy request: ${input.title}, ${input.city}`,
    line: `${employer.name} asked for a vacancy: ${input.title}, ${input.city}. It is a draft until someone publishes it.`,
    href: `/admin/jobs/${data.id}`,
    actionLabel: 'Open the draft',
    origin: new URL(request.url).origin,
  });
  await notifyStaff({
    permission: 'jobs.edit',
    kind: 'vacancy.request',
    title: `Vacancy request: ${input.title}`,
    body: `${employer.name} · ${input.city}`,
    href: `/admin/jobs/${data.id}`,
  });
  return NextResponse.json({ id: data.id, status: 'created' }, { status: 201 });
}
