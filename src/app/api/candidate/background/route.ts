import { NextResponse } from 'next/server';
import { getSessionCandidate } from '@/lib/auth';
import { backgroundSchema, backgroundToRow } from '@/lib/candidate/background';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

/**
 * The candidate saves their own background answers.
 *
 * Which candidate comes from the session only. The whole set is written each
 * time, so clearing an answer back to "not answered" is possible.
 */
export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'not_configured', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const parsed = backgroundSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { error } = await admin
    .from('candidate_backgrounds')
    .upsert({ candidate_id: candidate.id, ...backgroundToRow(parsed.data) }, { onConflict: 'candidate_id' });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  return NextResponse.json({ status: 'saved' });
}
