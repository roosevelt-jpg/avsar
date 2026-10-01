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
    /**
     * A refusal here is not a server fault, and answering it with a bare 500
     * leaves a candidate clicking a dead button mid-assessment with their
     * answers apparently saving. RLS gives one message for several different
     * situations, so work out which one it is and say so.
     */
    if (error.code === '42501') {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        return NextResponse.json({ error: 'session_expired' }, { status: 401 });
      }

      const { data: attempt } = await supabase
        .from('assessment_attempts')
        .select('id, submitted_at, expires_at')
        .eq('id', attemptId)
        .maybeSingle();

      if (!attempt) {
        /* Not theirs, or gone. The page holds a stale id and needs reloading. */
        console.error('[answer] attempt not visible to session', attemptId);
        return NextResponse.json({ error: 'attempt_unknown' }, { status: 409 });
      }
      if (attempt.submitted_at) {
        console.error('[answer] attempt already submitted', attemptId, attempt.submitted_at);
        return NextResponse.json({ error: 'attempt_submitted' }, { status: 409 });
      }
      if (new Date(attempt.expires_at as string) <= new Date()) {
        console.error('[answer] attempt expired', attemptId, attempt.expires_at);
        return NextResponse.json({ error: 'attempt_expired' }, { status: 409 });
      }

      console.error('[answer] refused with attempt open', attemptId, error.message);
      return NextResponse.json({ error: 'refused' }, { status: 409 });
    }

    console.error('[answer] upsert failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
