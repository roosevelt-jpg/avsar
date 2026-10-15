import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

const schema = z.object({ jobId: z.string().uuid() });

/**
 * Save or unsave a job for the signed-in candidate.
 *
 * Written through the session client, so the saved_jobs RLS policy is what
 * pins the row to this candidate; the candidate id is never read from the body.
 */
async function handle(request: Request, save: boolean) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'demo_mode' }, { status: 503 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { error } = save
    ? await supabase
        .from('saved_jobs')
        .upsert({ candidate_id: candidate.id, job_id: parsed.data.jobId }, { onConflict: 'candidate_id,job_id', ignoreDuplicates: true })
    : await supabase.from('saved_jobs').delete().eq('candidate_id', candidate.id).eq('job_id', parsed.data.jobId);

  if (error) {
    /* A job that has since been deleted is the only realistic foreign-key failure. */
    if (error.code === '23503') return NextResponse.json({ error: 'job_not_found' }, { status: 404 });
    console.error('[saved-jobs] write failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }
  return NextResponse.json({ saved: save });
}

export async function POST(request: Request) {
  return handle(request, true);
}

export async function DELETE(request: Request) {
  return handle(request, false);
}
