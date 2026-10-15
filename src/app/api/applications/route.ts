import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate, getViewer, hasPaid } from '@/lib/auth';
import { getSiteSettings } from '@/lib/cms/data';
import { getServerSupabase } from '@/lib/supabase/server';
import { getAnonSupabase } from '@/lib/supabase/anon';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sendWhatsApp } from '@/lib/whatsapp';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { sendApplicationUpdate } from '@/lib/email/application';
import type { ScreeningQuestion } from '@/lib/jobs/types';
import { clientIp, rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { withIdempotency } from '@/lib/security/idempotency';
import { notifyStaff } from '@/lib/notifications/staff';
import { log, requestIdOf } from '@/lib/observability/log';
import { recordConsent } from '@/lib/privacy/log';

export const runtime = 'nodejs';

const schema = z.object({
  jobId: z.string().uuid(),
  coverNote: z.string().trim().max(2000).nullable().optional(),
  answers: z.record(z.string().max(40), z.string().trim().max(500)).default({}),
  source: z.string().trim().max(80).optional(),
  /** Ticked on the apply form. Only ever turns the opt-in on; turning it off is on the dashboard. */
  whatsappOptIn: z.boolean().optional(),
  /** A CV this candidate uploaded through /api/cv/upload a moment ago. Ownership is checked below. */
  cvDocumentId: z.string().uuid().optional(),
});

/**
 * A candidate applies to a job.
 *
 * Identity comes from the session; the job, status and timestamps are decided
 * by `apply_to_job()` in the database, so nothing in the body can apply as
 * somebody else, to a draft, or straight into "offer".
 */
export async function POST(request: Request) {
  const limited = await rateLimit(RATE_LIMITS.apply, clientIp(request));
  if (!limited.ok) return rateLimitedResponse(limited);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  /* A bare checkout: the flow is clickable end to end and nothing is stored. */
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ reference: 'APP-DEMO0001', simulated: true });
  }

  const candidate = await getSessionCandidate();
  if (!candidate) {
    const viewer = await getViewer();
    return NextResponse.json(
      { error: viewer.role === 'anonymous' ? 'unauthorized' : 'no_candidate' },
      { status: viewer.role === 'anonymous' ? 401 : 403 },
    );
  }

  return withIdempotency(request, 'apply', candidate.id, () => apply(request, candidate, parsed.data));
}

async function apply(
  request: Request,
  candidate: NonNullable<Awaited<ReturnType<typeof getSessionCandidate>>>,
  input: z.infer<typeof schema>,
): Promise<NextResponse> {
  const settings = await getSiteSettings();
  if (settings.applications.requirePaidAssessment && !hasPaid(candidate)) {
    return NextResponse.json({ error: 'payment_required' }, { status: 402 });
  }

  /* Required questions are checked here because the database function cannot
     know which answers matter. Read through the anon client: if the job is
     not public, it is not appliable either. */
  const anon = getAnonSupabase();
  const { data: job } = (await anon
    ?.from('job_postings')
    .select('id, title, screening_questions')
    .eq('id', input.jobId)
    .maybeSingle()) ?? { data: null };
  if (!job) return NextResponse.json({ error: 'job_not_open' }, { status: 409 });

  const questions = (Array.isArray(job.screening_questions) ? job.screening_questions : []) as ScreeningQuestion[];
  const knownIds = new Set(questions.map((q) => q.id));
  const answers = Object.fromEntries(Object.entries(input.answers).filter(([id]) => knownIds.has(id)));
  const missing = questions.filter((q) => q.required && !answers[q.id]);
  if (missing.length) {
    return NextResponse.json({ error: 'answers_required', missing: missing.map((q) => q.id) }, { status: 422 });
  }

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  /* Whether this is a new application, so a double click or a repeat visit
     does not send a second "application received" email. */
  const { data: prior } = await supabase
    .from('applications')
    .select('status')
    .eq('job_id', input.jobId)
    .eq('candidate_id', candidate.id)
    .maybeSingle();
  const isNew = !prior || prior.status === 'withdrawn';

  const { data, error } = await supabase.rpc('apply_to_job', {
    p_job_id: input.jobId,
    p_cover_note: input.coverNote ?? null,
    p_answers: answers,
    p_source: input.source ?? null,
  });

  if (error) {
    const message = error.message ?? '';
    if (message.includes('job_not_open')) return NextResponse.json({ error: 'job_not_open' }, { status: 409 });
    if (message.includes('no_candidate_for_session')) return NextResponse.json({ error: 'no_candidate' }, { status: 403 });
    log.error('applications.apply_failed', { requestId: requestIdOf(request), jobId: input.jobId, error });
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  const application = (Array.isArray(data) ? data[0] : data) as { id: string; reference: string } | null;
  if (!application) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });

  /* Extras the database function does not take. The service role writes them,
     keyed on ids that came from the session or were checked against it, and a
     failure here never fails the application itself. */
  const admin = getAdminSupabase();
  if (admin && input.whatsappOptIn) {
    const { data: optedIn, error: optInError } = await admin
      .from('candidates')
      .update({ whatsapp_opt_in_at: new Date().toISOString() })
      .eq('id', candidate.id)
      .is('whatsapp_opt_in_at', null)
      .select('id');
    if (optInError) console.error('[applications] whatsapp opt-in failed', optInError);
    if (optedIn && optedIn.length > 0) await recordConsent(candidate.id, 'whatsapp', true, 'apply_form');
  }
  if (admin && input.cvDocumentId) {
    const { data: cv } = await admin
      .from('cv_documents')
      .select('id')
      .eq('id', input.cvDocumentId)
      .eq('candidate_id', candidate.id)
      .maybeSingle();
    if (cv) {
      const { error: cvError } = await admin.from('applications').update({ cv_document_id: cv.id }).eq('id', application.id);
      if (cvError) console.error('[applications] cv attach failed', cvError);
    }
  }

  if (isNew) {
    await sendWhatsApp({
      candidateId: candidate.id,
      applicationId: application.id,
      template: 'application_received',
      params: [candidate.fullName.split(' ')[0] || candidate.fullName, String(job.title), application.reference],
    });
    await sendApplicationUpdate({
      to: candidate.email,
      name: candidate.fullName,
      jobTitle: String(job.title),
      reference: application.reference,
      status: 'submitted',
      origin: new URL(request.url).origin,
      locale: candidate.locale,
    });
    await notifyStaff({
      permission: 'applications.view',
      kind: 'application.new',
      title: `New application: ${String(job.title)}`,
      body: `${candidate.fullName} · ${application.reference}`,
      href: `/admin/applications/${application.id}`,
    });
  }

  return NextResponse.json({ id: application.id, reference: application.reference });
}
