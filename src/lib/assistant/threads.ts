import type { Locale } from '@/lib/i18n';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { notifyStaff } from '@/lib/notifications/staff';
import type { ChatAgent } from './agents';
import { askedForHuman, assistantHandoff } from './language';

export type ChatMode = 'ai' | 'human' | 'closed';

export type ChatThread = {
  id: string;
  publicKey: string;
  channel: 'web' | 'whatsapp';
  agentId: string | null;
  assigneeUserId: string | null;
  mode: ChatMode;
  visitorLabel: string;
  intake: Record<string, string>;
  needsHuman: boolean;
  lastMessageAt: string;
};

export type ThreadMessage = {
  id: number;
  role: 'user' | 'assistant' | 'staff';
  body: string;
  sources: string[];
  senderUserId: string | null;
  senderName: string;
  senderAvatar: string;
  createdAt: string;
};

type ThreadRow = {
  id: string;
  public_key: string;
  channel: 'web' | 'whatsapp';
  agent_id: string | null;
  assignee_user_id: string | null;
  mode: ChatMode;
  visitor_label: string;
  intake: Record<string, string> | null;
  needs_human: boolean;
  last_message_at: string;
};

function fromRow(row: ThreadRow): ChatThread {
  return {
    id: row.id,
    publicKey: row.public_key,
    channel: row.channel,
    agentId: row.agent_id,
    assigneeUserId: row.assignee_user_id,
    mode: row.mode,
    visitorLabel: row.visitor_label ?? '',
    intake: row.intake ?? {},
    needsHuman: row.needs_human,
    lastMessageAt: row.last_message_at,
  };
}

export function visitorAskedForHuman(question: string): boolean {
  return askedForHuman(question);
}

export function handoffCopy(channel: 'web' | 'whatsapp', locale: Locale = 'en'): string {
  return assistantHandoff(channel, locale);
}

/** Find or create the conversation keyed by the visitor session / WhatsApp id. */
export async function ensureThread(input: {
  publicKey: string;
  channel: 'web' | 'whatsapp';
  agent?: ChatAgent | null;
  assigneeUserId?: string | null;
  /** Live human now — park for staff immediately. */
  forceHuman?: boolean;
  /**
   * Personal AI for a teammate: keep AI mode, but assign the thread so
   * escalation lands with that person.
   */
  personalAi?: boolean;
}): Promise<ChatThread | null> {
  const admin = getAdminSupabase();
  if (!admin) return null;

  const { data: existing } = await admin
    .from('chat_threads')
    .select('id, public_key, channel, agent_id, assignee_user_id, mode, visitor_label, intake, needs_human, last_message_at')
    .eq('public_key', input.publicKey)
    .maybeSingle();

  if (existing) {
    const thread = fromRow(existing as ThreadRow);
    const patch: Record<string, unknown> = {};
    if (input.agent && !thread.agentId) patch.agent_id = input.agent.id;
    if (input.assigneeUserId && !thread.assigneeUserId) {
      patch.assignee_user_id = input.assigneeUserId;
      if (input.forceHuman || !input.personalAi) {
        patch.mode = 'human';
        patch.needs_human = true;
      }
    }
    if (input.forceHuman && thread.mode !== 'human') {
      patch.mode = 'human';
      patch.needs_human = true;
    }
    if (Object.keys(patch).length === 0) return thread;
    const { data: updated } = await admin
      .from('chat_threads')
      .update(patch)
      .eq('id', thread.id)
      .select('id, public_key, channel, agent_id, assignee_user_id, mode, visitor_label, intake, needs_human, last_message_at')
      .single();
    return updated ? fromRow(updated as ThreadRow) : thread;
  }

  const mode: ChatMode = input.forceHuman ? 'human' : 'ai';
  const { data: created, error } = await admin
    .from('chat_threads')
    .insert({
      public_key: input.publicKey,
      channel: input.channel,
      agent_id: input.agent?.id ?? null,
      assignee_user_id: input.assigneeUserId ?? null,
      mode,
      needs_human: mode === 'human',
    })
    .select('id, public_key, channel, agent_id, assignee_user_id, mode, visitor_label, intake, needs_human, last_message_at')
    .single();

  if (error || !created) {
    console.error('[chat] ensureThread failed', error?.message);
    return null;
  }
  return fromRow(created as ThreadRow);
}

export async function escalateThread(
  thread: ChatThread,
  reason: string,
): Promise<ChatThread> {
  const admin = getAdminSupabase();
  if (!admin) return thread;
  if (thread.mode === 'human' && thread.needsHuman) return thread;

  const { data } = await admin
    .from('chat_threads')
    .update({ mode: 'human', needs_human: true, last_message_at: new Date().toISOString() })
    .eq('id', thread.id)
    .select('id, public_key, channel, agent_id, assignee_user_id, mode, visitor_label, intake, needs_human, last_message_at')
    .single();

  const assignee = data ? fromRow(data as ThreadRow).assigneeUserId : thread.assigneeUserId;
  await notifyStaff({
    permission: 'leads.manage',
    kind: 'chat.escalate',
    title: assignee ? 'Your personal assistant handed off a chat' : 'Live chat needs a recruiter',
    body: reason.slice(0, 200),
    href: `/admin/chat?thread=${thread.id}`,
  });

  return data ? fromRow(data as ThreadRow) : { ...thread, mode: 'human', needsHuman: true };
}

export async function touchThread(threadId: string): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;
  await admin.from('chat_threads').update({ last_message_at: new Date().toISOString() }).eq('id', threadId);
}

export async function mergeIntake(
  thread: ChatThread,
  question: string,
): Promise<ChatThread> {
  const admin = getAdminSupabase();
  if (!admin) return thread;
  const next = { ...thread.intake };
  const name = question.match(/\b(?:my name is|i am|i'm)\s+([A-Za-z][A-Za-z .'-]{1,60})/i);
  if (name?.[1] && !next.name) next.name = name[1].trim().slice(0, 80);
  const phone = question.match(/(?:\+|00)?\d[\d\s()-]{8,18}\d/);
  if (phone?.[0] && !next.whatsapp) next.whatsapp = phone[0].replace(/\s+/g, '').slice(0, 40);
  const city = question.match(/\b(?:from|in|near)\s+([A-Za-z][A-Za-z .'-]{2,40})\b/i);
  if (city?.[1] && !next.city) next.city = city[1].trim().slice(0, 80);

  const label = [next.name, next.city, next.whatsapp].filter(Boolean).join(' · ').slice(0, 200);
  if (JSON.stringify(next) === JSON.stringify(thread.intake) && label === thread.visitorLabel) {
    return thread;
  }

  const { data } = await admin
    .from('chat_threads')
    .update({ intake: next, visitor_label: label || thread.visitorLabel })
    .eq('id', thread.id)
    .select('id, public_key, channel, agent_id, assignee_user_id, mode, visitor_label, intake, needs_human, last_message_at')
    .single();
  return data ? fromRow(data as ThreadRow) : thread;
}

export async function insertTurn(input: {
  thread: ChatThread;
  channel: 'web' | 'whatsapp';
  role: 'user' | 'assistant' | 'staff';
  body: string;
  sources?: string[];
  agentId?: string | null;
  senderUserId?: string | null;
  externalId?: string | null;
}): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;
  await admin.from('assistant_messages').insert({
    channel: input.channel,
    thread_key: input.thread.publicKey,
    thread_id: input.thread.id,
    agent_id: input.agentId ?? input.thread.agentId,
    sender_user_id: input.senderUserId ?? null,
    role: input.role,
    body: input.body,
    sources: input.sources ?? [],
    external_id: input.externalId ?? null,
  });
  await touchThread(input.thread.id);
}

export async function listThreadMessages(
  threadId: string,
  afterId = 0,
): Promise<ThreadMessage[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];
  let query = admin
    .from('assistant_messages')
    .select('id, role, body, sources, sender_user_id, created_at')
    .eq('thread_id', threadId)
    .order('id', { ascending: true })
    .limit(100);
  if (afterId > 0) query = query.gt('id', afterId);
  const { data } = await query;
  return ((data ?? []) as {
    id: number;
    role: 'user' | 'assistant' | 'staff';
    body: string;
    sources: string[] | null;
    sender_user_id: string | null;
    created_at: string;
  }[]).map((row) => ({
    id: row.id,
    role: row.role,
    body: String(row.body),
    sources: row.sources ?? [],
    senderUserId: row.sender_user_id,
    senderName: '',
    senderAvatar: '',
    createdAt: row.created_at,
  }));
}

export async function getThreadByPublicKey(publicKey: string): Promise<ChatThread | null> {
  const admin = getAdminSupabase();
  if (!admin) return null;
  const { data } = await admin
    .from('chat_threads')
    .select('id, public_key, channel, agent_id, assignee_user_id, mode, visitor_label, intake, needs_human, last_message_at')
    .eq('public_key', publicKey)
    .maybeSingle();
  return data ? fromRow(data as ThreadRow) : null;
}

export async function getThreadById(id: string): Promise<ChatThread | null> {
  const admin = getAdminSupabase();
  if (!admin) return null;
  const { data } = await admin
    .from('chat_threads')
    .select('id, public_key, channel, agent_id, assignee_user_id, mode, visitor_label, intake, needs_human, last_message_at')
    .eq('id', id)
    .maybeSingle();
  return data ? fromRow(data as ThreadRow) : null;
}
