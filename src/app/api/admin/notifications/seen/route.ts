import { NextResponse } from 'next/server';
import { apiStaff } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/** "I have looked." Moves this person's read marker to now; nobody else's. */
export async function POST() {
  const guard = await apiStaff();
  if (guard instanceof NextResponse) return guard;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { error } = await admin
    .from('staff_notification_seen')
    .upsert({ user_id: guard.userId, seen_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  return NextResponse.json({ status: 'saved' });
}
