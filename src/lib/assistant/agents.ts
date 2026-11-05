import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';

export type ChatAgent = {
  id: string;
  slug: string;
  displayName: string;
  title: string;
  department: string;
  avatarPath: string;
  systemFocus: string;
  knowledgeTags: string[];
  sortOrder: number;
};

export type StaffOnline = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  lastSeenAt: string;
};

/** Staff marked as personal AI assistants (WhatsApp optional). */
export type PersonalAssistant = {
  userId: string;
  displayName: string;
  title: string;
  whatsapp: string;
  avatarUrl: string;
};

type AgentRow = {
  id: string;
  slug: string;
  display_name: string;
  title: string;
  department: string;
  avatar_path: string;
  system_focus: string;
  knowledge_tags: string[] | null;
  sort_order: number;
};

function agentFromRow(row: AgentRow): ChatAgent {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    title: row.title,
    department: row.department,
    avatarPath: row.avatar_path,
    systemFocus: row.system_focus,
    knowledgeTags: row.knowledge_tags ?? [],
    sortOrder: row.sort_order,
  };
}

/** Active AI personas for the visitor picker. */
export async function listActiveAgents(): Promise<ChatAgent[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chat_agents')
    .select('id, slug, display_name, title, department, avatar_path, system_focus, knowledge_tags, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('[chat] agents list failed', error.message);
    return [];
  }
  return ((data ?? []) as AgentRow[]).map(agentFromRow);
}

export async function getAgentBySlug(slug: string): Promise<ChatAgent | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from('chat_agents')
    .select('id, slug, display_name, title, department, avatar_path, system_focus, knowledge_tags, sort_order')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  return data ? agentFromRow(data as AgentRow) : null;
}

export async function getAgentById(id: string): Promise<ChatAgent | null> {
  const admin = getAdminSupabase();
  if (!admin) return null;
  const { data } = await admin
    .from('chat_agents')
    .select('id, slug, display_name, title, department, avatar_path, system_focus, knowledge_tags, sort_order')
    .eq('id', id)
    .maybeSingle();
  return data ? agentFromRow(data as AgentRow) : null;
}

/** Staff who heartbeat within the last three minutes. */
export async function listOnlineStaff(): Promise<StaffOnline[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const since = new Date(Date.now() - 3 * 60_000).toISOString();
  const { data, error } = await supabase
    .from('staff_presence')
    .select('user_id, display_name, avatar_url, last_seen_at')
    .eq('online', true)
    .gt('last_seen_at', since)
    .order('display_name', { ascending: true });
  if (error) {
    console.error('[chat] presence list failed', error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    userId: String(row.user_id),
    displayName: String(row.display_name || 'Recruiter'),
    avatarUrl: String(row.avatar_url || ''),
    lastSeenAt: String(row.last_seen_at),
  }));
}

/**
 * Teammates admins turned on as personal AI assistants.
 * Uses a security-definer RPC so anon chat can read names without staff RLS.
 */
export async function listPersonalAssistants(): Promise<PersonalAssistant[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('list_personal_assistants');
  if (error) {
    console.error('[chat] personal assistants list failed', error.message);
    return [];
  }
  return ((data ?? []) as {
    user_id: string;
    display_name: string;
    title: string;
    whatsapp: string;
    avatar_url: string;
  }[]).map((row) => ({
    userId: String(row.user_id),
    displayName: String(row.display_name || 'Recruiter'),
    title: String(row.title || 'Recruiter'),
    whatsapp: String(row.whatsapp || ''),
    avatarUrl: String(row.avatar_url || ''),
  }));
}

/** One personal assistant by auth user id, or null if not enabled. */
export async function getPersonalAssistant(userId: string): Promise<PersonalAssistant | null> {
  const admin = getAdminSupabase();
  if (!admin) return null;
  const { data } = await admin
    .from('staff_users')
    .select('auth_user_id, full_name, email, whatsapp, personal_assistant, active, role')
    .eq('auth_user_id', userId)
    .eq('active', true)
    .eq('personal_assistant', true)
    .maybeSingle();
  if (!data) return null;
  const { data: role } = await admin.from('roles').select('name').eq('key', data.role).maybeSingle();
  const { data: presence } = await admin
    .from('staff_presence')
    .select('avatar_url')
    .eq('user_id', userId)
    .maybeSingle();
  const name = String(data.full_name || '').trim() || String(data.email).split('@')[0] || 'Recruiter';
  return {
    userId: String(data.auth_user_id),
    displayName: name,
    title: String(role?.name || 'Recruiter'),
    whatsapp: String(data.whatsapp || ''),
    avatarUrl: String(presence?.avatar_url || ''),
  };
}
