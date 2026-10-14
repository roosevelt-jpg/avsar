import { NextResponse } from 'next/server';
import { getSessionCandidate } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

/** A candidate withdraws their own application. The database decides whether it still can be. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!isSupabaseConfigured()) return NextResponse.json({ withdrawn: true, simulated: true });

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { error } = await supabase.rpc('withdraw_application', { p_application_id: id });
  if (error) {
    if (error.message?.includes('not_withdrawable')) return NextResponse.json({ error: 'not_withdrawable' }, { status: 409 });
    if (error.message?.includes('not_found')) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    console.error('[applications] withdraw failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }
  return NextResponse.json({ withdrawn: true });
}
