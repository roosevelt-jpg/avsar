import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/** Take ownership of a live thread so other staff see it is claimed. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('leads.manage');
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const { data, error } = await admin
    .from('chat_threads')
    .update({
      assignee_user_id: guard.userId,
      mode: 'human',
      needs_human: true,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await audit(guard.userId, 'chat.claim', `thread:${id}`);
  return NextResponse.json({ ok: true });
}
