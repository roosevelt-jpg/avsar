import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Records a reviewer's decision on an AI-assisted assessment.
 *
 * This endpoint is the point of the whole feature. The model produces a
 * suggestion; nothing happens to a candidate until a row lands here, attributed
 * to a named person. The reason is mandatory on any departure from the
 * suggestion, enforced again in the database by a check constraint.
 */
const schema = z
  .object({
    assessmentId: z.string().uuid(),
    outcome: z.enum(['advance', 'hold', 'reject', 'needs_more_info']),
    reviewerScore: z.number().int().min(0).max(100).optional(),
    agreedWithAi: z.boolean(),
    reason: z.string().trim().max(2000).optional(),
  })
  .refine((value) => value.agreedWithAi || (value.reason?.length ?? 0) >= 10, {
    message: 'A reason of at least 10 characters is required when overriding the suggestion.',
    path: ['reason'],
  });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { assessmentId, outcome, reviewerScore, agreedWithAi, reason } = parsed.data;

  const { error } = await supabase.from('cv_review_decisions').insert({
    assessment_id: assessmentId,
    /* Taken from the session, never from the body: a decision has to be
       attributable to the person who actually made it. */
    reviewer: auth.user.id,
    outcome,
    reviewer_score: reviewerScore ?? null,
    agreed_with_ai: agreedWithAi,
    reason: reason ?? null,
  });

  if (error) {
    console.error('[cv/decision] insert failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  return NextResponse.json({ recorded: true });
}
