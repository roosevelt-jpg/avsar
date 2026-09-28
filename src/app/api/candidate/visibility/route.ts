import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const schema = z.object({ visible: z.boolean() });

/** Hides or shows the candidate's talent-pool profile. RLS scopes it to them. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ saved: false, reason: 'storage_unconfigured' });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { error } = await supabase
    .from('candidates')
    .update({ visible_to_employers: parsed.data.visible })
    .eq('auth_user_id', auth.user.id);

  if (error) {
    console.error('[visibility] update failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }
  return NextResponse.json({ saved: true });
}
