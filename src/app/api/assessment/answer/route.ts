import { NextResponse } from 'next/server';
import { answerSchema } from '@/lib/validation';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Saves one answer.
 *
 * Per-answer rather than per-section, because the handoff requires resume after
 * a dropped connection and most candidates are on mobile data. The answer is
 * stored raw; scoring runs server-side when the attempt is submitted, so the
 * browser never learns which option was right.
 */
export async function POST(request: Request) {
  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const supabase = await getServerSupabase();
  if (!supabase) {
    // Not configured: the client keeps its own state and nothing is lost in dev.
    return NextResponse.json({ saved: false, reason: 'storage_unconfigured' });
  }

  const { attemptId, itemId, optionIndex } = parsed.data;

  /* RLS restricts this to the signed-in candidate's own attempt, and refuses
     once the attempt is submitted, so a late answer cannot rewrite a score. */
  const { error } = await supabase.from('assessment_answers').upsert(
    {
      attempt_id: attemptId,
      item_id: itemId,
      option_index: optionIndex,
      answered_at: new Date().toISOString(),
    },
    { onConflict: 'attempt_id,item_id' },
  );

  if (error) {
    console.error('[answer] upsert failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
