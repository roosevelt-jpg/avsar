import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const schema = z.object({
  online: z.boolean().default(true),
});

/** Heartbeat from the console so the visitor picker can show live staff. */
export async function POST(request: Request) {
  const guard = await apiPermission('leads.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => ({ online: true })));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  let displayName = '';
  let avatarUrl = '';
  const supabase = await getServerSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    displayName = String(meta.full_name || meta.name || data.user?.email || 'Recruiter').slice(0, 120);
    avatarUrl = String(meta.avatar_url || meta.picture || '').slice(0, 500);
  }

  const { error } = await admin.from('staff_presence').upsert({
    user_id: guard.userId,
    online: parsed.data.online,
    display_name: displayName,
    avatar_url: avatarUrl,
    last_seen_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
