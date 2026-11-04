import { NextResponse } from 'next/server';
import { getThreadById, listThreadMessages } from '@/lib/assistant/threads';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/** One thread plus messages for the console pane. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('leads.manage');
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const thread = await getThreadById(id);
  if (!thread) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const messages = await listThreadMessages(thread.id);
  const admin = getAdminSupabase();
  const staffIds = [...new Set(messages.filter((m) => m.senderUserId).map((m) => m.senderUserId!))];
  const profiles = new Map<string, { name: string; avatar: string }>();
  if (admin && staffIds.length > 0) {
    const { data } = await admin.from('staff_presence').select('user_id, display_name, avatar_url').in('user_id', staffIds);
    for (const row of data ?? []) {
      profiles.set(String(row.user_id), {
        name: String(row.display_name || 'Recruiter'),
        avatar: String(row.avatar_url || ''),
      });
    }
  }

  let agentName = '';
  if (admin && thread.agentId) {
    const { data } = await admin.from('chat_agents').select('display_name').eq('id', thread.agentId).maybeSingle();
    agentName = String(data?.display_name || '');
  }

  return NextResponse.json({
    thread: {
      id: thread.id,
      publicKey: thread.publicKey,
      channel: thread.channel,
      mode: thread.mode,
      needsHuman: thread.needsHuman,
      visitorLabel: thread.visitorLabel,
      intake: thread.intake,
      assigneeUserId: thread.assigneeUserId,
      agentId: thread.agentId,
      agentName,
      lastMessageAt: thread.lastMessageAt,
    },
    messages: messages.map((message) => {
      const profile = message.senderUserId ? profiles.get(message.senderUserId) : null;
      return {
        id: message.id,
        role: message.role,
        body: message.body,
        sources: message.sources,
        senderName: profile?.name ?? (message.role === 'assistant' ? agentName || 'Assistant' : ''),
        senderAvatar: profile?.avatar ?? '',
        createdAt: message.createdAt,
      };
    }),
  });
}
