import { NextResponse } from 'next/server';
import { getAnonSupabase } from '@/lib/supabase/anon';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * For the uptime monitor. 200 when the app is up and, if Supabase is
 * configured, the database answers a one-row read as the public would.
 * Says nothing about configuration beyond demo or live.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mode: 'demo' }, { headers: { 'cache-control': 'no-store' } });
  }

  const anon = getAnonSupabase();
  const started = Date.now();
  const { error } = (await anon?.from('job_postings').select('id').limit(1)) ?? { error: new Error('no_client') };
  const ok = !error;
  if (error) console.error('[health] database check failed', error);

  return NextResponse.json(
    { ok, mode: 'live', databaseMs: Date.now() - started },
    { status: ok ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  );
}
