import { refreshIntegrations } from '@/lib/integrations/runtime';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getViewer } from '@/lib/auth';
import { computeStats, suspectItems } from '@/lib/assessment/calibration';
import { ITEM_BANK } from '@/lib/assessment/items';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Recomputes difficulty and discrimination from real responses.
 *
 * Runs on a schedule or by hand, never on a read. The statistics change slowly
 * and the calculation walks every answer ever given, so doing it when somebody
 * loads a page would be both wasteful and a way to make the assessment slow for
 * the person sitting it.
 *
 * Staff or the cron secret. It reads every candidate's answers with the service
 * role, so it is not something to leave open: the answer key is derivable from
 * enough of this output.
 */
async function run(request: Request) {
  await refreshIntegrations();
  const secret = process.env.CRON_SECRET;
  const authorised =
    (secret && request.headers.get('authorization') === `Bearer ${secret}`) ||
    (await getViewer()).role === 'staff';

  if (!authorised) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  /**
   * Only submitted attempts.
   *
   * An attempt still open is a candidate part-way through, and counting their
   * unanswered items as responses would read as a wave of wrong answers and
   * push every item's difficulty up.
   */
  const { data: rows, error } = await admin
    .from('assessment_answers')
    .select('item_id, option_index, assessment_attempts!inner(candidate_id, submitted_at)')
    .not('assessment_attempts.submitted_at', 'is', null);

  if (error) {
    console.error('[calibrate] query failed', error);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  const key = new Map(ITEM_BANK.map((item) => [item.id, item.correct]));

  type Row = {
    item_id: string;
    option_index: number;
    assessment_attempts: { candidate_id: string } | { candidate_id: string }[];
  };

  const responses = [];
  for (const row of (rows ?? []) as Row[]) {
    const correct = key.get(row.item_id);
    /* Only keyed items. An ordinal item has no right answer, so difficulty and
       discrimination mean nothing for it. */
    if (correct === undefined) continue;

    const attempt = Array.isArray(row.assessment_attempts)
      ? row.assessment_attempts[0]
      : row.assessment_attempts;
    if (!attempt) continue;

    responses.push({
      candidateId: attempt.candidate_id,
      itemId: row.item_id,
      correct: row.option_index === correct,
    });
  }

  const stats = computeStats(responses);

  if (stats.length > 0) {
    const { error: writeError } = await admin.from('item_stats').upsert(
      stats.map((stat) => ({
        item_id: stat.itemId,
        n_responses: stat.n,
        p_value: stat.pValue,
        discrimination: stat.discrimination,
        computed_at: new Date().toISOString(),
      })),
      { onConflict: 'item_id' },
    );

    if (writeError) {
      console.error('[calibrate] write failed', writeError);
      return NextResponse.json({ error: 'write_failed' }, { status: 500 });
    }
  }

  const suspects = suspectItems(stats);

  return NextResponse.json({
    responses: responses.length,
    items: stats.length,
    /* Named rather than counted. A list of four item ids and what is wrong with
       them is something somebody acts on; a number is something they scroll
       past. */
    suspect: suspects.map((row) => ({
      itemId: row.stat.itemId,
      n: row.stat.n,
      pValue: row.stat.pValue,
      discrimination: row.stat.discrimination,
      reason: row.reason,
      prompt: row.item?.prompt ?? null,
    })),
  });
}

export const GET = run;
export const POST = run;
