import { NextResponse } from 'next/server';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/** Open live-chat threads for the CRM queue. */
export async function GET(request: Request) {
  const guard = await apiPermission('leads.manage');
  if (guard instanceof NextResponse) return guard;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const url = new URL(request.url);
  const needsHuman = url.searchParams.get('needs_human');
  const agentId = url.searchParams.get('agent');

  let query = admin
    .from('chat_threads')
    .select(
      'id, public_key, channel, agent_id, assignee_user_id, mode, visitor_label, intake, needs_human, last_message_at, created_at, chat_agents(display_name, department, slug)',
    )
    .order('last_message_at', { ascending: false })
    .limit(80);

  if (needsHuman === '1') query = query.eq('needs_human', true);
  if (agentId) query = query.eq('agent_id', agentId);
  query = query.neq('mode', 'closed');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'load_failed' }, { status: 500 });

  return NextResponse.json({
    threads: (data ?? []).map((row) => {
      const agent = Array.isArray(row.chat_agents) ? row.chat_agents[0] : row.chat_agents;
      return {
        id: row.id,
        publicKey: row.public_key,
        channel: row.channel,
        agentId: row.agent_id,
        agentName: agent?.display_name ?? '',
        department: agent?.department ?? '',
        assigneeUserId: row.assignee_user_id,
        mode: row.mode,
        visitorLabel: row.visitor_label,
        needsHuman: row.needs_human,
        lastMessageAt: row.last_message_at,
        createdAt: row.created_at,
      };
    }),
  });
}
