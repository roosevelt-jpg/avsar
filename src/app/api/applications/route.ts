import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate, getViewer, hasPaid } from '@/lib/auth';
import { getSiteSettings } from '@/lib/cms/data';
import { getServerSupabase } from '@/lib/supabase/server';
import { getAnonSupabase } from '@/lib/supabase/anon';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { sendApplicationUpdate } from '@/lib/email/application';
import type { ScreeningQuestion } from '@/lib/jobs/types';

export const runtime = 'nodejs';

const schema = z.object({
  jobId: z.string().uuid(),
  coverNote: z.string().trim().max(2000).nullable().optional(),
  answers: z.record(z.string().max(40), z.string().trim().max(500)).default({}),
  source: z.string().trim().max(80).optional(),
});

/**
 * A candidate applies to a job.
 *
 * Identity comes from the session; the job, status and timestamps are decided
 * by `apply_to_job()` in the database, so nothing in the body can apply as
 * somebody else, to a draft, or straight into "offer".
 */
export async function POST(request: Request) {
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
    .eq('id', parsed.data.jobId)
    .maybeSingle()) ?? { data: null };
  if (!job) return NextResponse.json({ error: 'job_not_open' }, { status: 409 });

  const questions = (Array.isArray(job.screening_questions) ? job.screening_questions : []) as ScreeningQuestion[];
  const knownIds = new Set(questions.map((q) => q.id));
  const answers = Object.fromEntries(Object.entries(parsed.data.answers).filter(([id]) => knownIds.has(id)));
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
    .eq('job_id', parsed.data.jobId)
    .eq('candidate_id', candidate.id)
    .maybeSingle();
  const isNew = !prior || prior.status === 'withdrawn';

  const { data, error } = await supabase.rpc('apply_to_job', {
    p_job_id: parsed.data.jobId,
    p_cover_note: parsed.data.coverNote ?? null,
    p_answers: answers,
    p_source: parsed.data.source ?? null,
  });

  if (error) {
    const message = error.message ?? '';
    if (message.includes('job_not_open')) return NextResponse.json({ error: 'job_not_open' }, { status: 409 });
    if (message.includes('no_candidate_for_session')) return NextResponse.json({ error: 'no_candidate' }, { status: 403 });
    console.error('[applications] apply failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  const application = (Array.isArray(data) ? data[0] : data) as { id: string; reference: string } | null;
  if (!application) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });

  if (isNew) {
    await sendApplicationUpdate({
      to: candidate.email,
      name: candidate.fullName,
      jobTitle: String(job.title),
      reference: application.reference,
      status: 'submitted',
      origin: new URL(request.url).origin,
      locale: candidate.locale,
    });
  }

  return NextResponse.json({ id: application.id, reference: application.reference });
}
