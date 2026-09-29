import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getSessionCandidate } from '@/lib/auth';
import { SECTION_ORDER } from '@/lib/assessment/items';
import { buildReport } from '@/lib/assessment/report';
import type { AnswerMap } from '@/lib/assessment/scoring';

export const runtime = 'nodejs';

const schema = z.object({ attemptId: z.string().uuid() });

/**
 * Closes a section, and writes the report once every section is in.
 *
 * Scoring runs here rather than in the browser because the answer key must not
 * leave the server, and the report is written with the service role because a
 * candidate must not be able to write their own score. `reports` has only
 * select policies, so the database would refuse it anyway; this is belt and
 * braces on something that decides whether someone gets a job.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const supabase = await getServerSupabase();
  const admin = getAdminSupabase();
  if (!supabase || !admin) {
    return NextResponse.json({ submitted: false, reason: 'storage_unconfigured' });
  }

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  /* The RPC stamps submitted_at server side and refuses an attempt that is not
     this candidate's or is already closed. */
  const { error: submitError } = await supabase.rpc('submit_assessment_attempt', {
    p_attempt_id: parsed.data.attemptId,
  });

  if (submitError) {
    console.error('[submit] rpc failed', submitError);
    return NextResponse.json({ error: 'attempt_not_open' }, { status: 409 });
  }

  const { data: attempts } = await admin
    .from('assessment_attempts')
    .select('id, section, submitted_at')
    .eq('candidate_id', candidate.id);

  const submitted = new Set(
    (attempts ?? []).filter((a) => a.submitted_at).map((a) => a.section as string),
  );

  const remaining = SECTION_ORDER.filter((section) => !submitted.has(section));

  if (remaining.length > 0) {
    return NextResponse.json({ submitted: true, nextSection: remaining[0], reportReady: false });
  }

  /* Every section is in. Score the lot and write the report. */
  const attemptIds = (attempts ?? []).map((a) => a.id as string);
  const { data: answerRows } = await admin
    .from('assessment_answers')
    .select('item_id, option_index')
    .in('attempt_id', attemptIds);

  const answers: AnswerMap = {};
  for (const row of answerRows ?? []) {
    answers[row.item_id as string] = row.option_index as number;
  }

  /* Sector already decided which items the candidate saw, so scoring does not
     need it again: the answers only reference items from their own bank. */
  const report = buildReport(answers);

  const { error: reportError } = await admin
    .from('reports')
    .upsert({ candidate_id: candidate.id, ...report }, { onConflict: 'candidate_id' });

  if (reportError) {
    console.error('[submit] report write failed', reportError);
    return NextResponse.json({ error: 'report_failed' }, { status: 500 });
  }

  /* Percentile is relative to everyone else, so it can only be computed once
     this row exists. It goes stale as later candidates are scored; the cohort
     is re-ranked in one pass at close. */
  const { error: rankError } = await admin.rpc('refresh_candidate_percentile', {
    p_candidate_id: candidate.id,
  });
  if (rankError) console.error('[submit] percentile refresh failed', rankError);

  return NextResponse.json({ submitted: true, nextSection: null, reportReady: true });
}
