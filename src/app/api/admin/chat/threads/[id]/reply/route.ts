import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { getThreadById, insertTurn } from '@/lib/assistant/threads';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z.object({
  message: z.string().trim().min(1).max(2000),
});

/** Staff reply into the same website thread the visitor is watching. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('leads.manage');
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const thread = await getThreadById(id);
  if (!thread) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  await admin
    .from('chat_threads')
    .update({
      assignee_user_id: thread.assigneeUserId ?? guard.userId,
      mode: 'human',
      needs_human: false,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', id);

  await insertTurn({
    thread: { ...thread, assigneeUserId: thread.assigneeUserId ?? guard.userId, mode: 'human' },
    channel: thread.channel,
    role: 'staff',
    body: parsed.data.message,
    senderUserId: guard.userId,
  });

  await audit(guard.userId, 'chat.reply', `thread:${id}`, { length: parsed.data.message.length });
  return NextResponse.json({ ok: true });
}
