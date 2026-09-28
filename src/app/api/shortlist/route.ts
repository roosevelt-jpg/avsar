import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const schema = z.object({ candidateId: z.string().min(1).max(64), shortlisted: z.boolean() });

/** Adds or removes a candidate from the signed-in employer's shortlist. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ saved: false, reason: 'storage_unconfigured' });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { candidateId, shortlisted } = parsed.data;

  /* The employer is resolved from the session by RLS, never from the request
     body, so one employer cannot write into another's shortlist. */
  if (shortlisted) {
    const { error } = await supabase
      .from('shortlist_entries')
      .upsert({ candidate_id: candidateId }, { onConflict: 'employer_id,candidate_id' });
    if (error) {
      console.error('[shortlist] insert failed', error);
      return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from('shortlist_entries').delete().eq('candidate_id', candidateId);
    if (error) {
      console.error('[shortlist] delete failed', error);
      return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ saved: true });
}
