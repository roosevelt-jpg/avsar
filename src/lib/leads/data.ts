import { getServerSupabase } from '@/lib/supabase/server';

/**
 * The inbox: people who wrote to us, or were handed to us, before applying.
 *
 * Read through the session client, so the `leads.manage` policy decides what
 * comes back, the same way the page guard decides who gets here.
 */

export * from '@/lib/leads/types';
import type { Lead, LeadEvent, LeadKind, LeadStatus, LeadTopic } from '@/lib/leads/types';

export const LEAD_COLUMNS =
  'id, kind, status, topic, full_name, email, phone, whatsapp_ok, message, position, city, company, openings, source, candidate_id, assigned_to, created_at, updated_at';

export function leadFromRow(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    kind: row.kind as LeadKind,
    status: row.status as LeadStatus,
    topic: row.topic as LeadTopic,
    fullName: String(row.full_name ?? ''),
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    whatsappOk: Boolean(row.whatsapp_ok),
    message: (row.message as string | null) ?? null,
    position: (row.position as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    company: (row.company as string | null) ?? null,
    openings: row.openings == null ? null : Number(row.openings),
    source: (row.source as string | null) ?? null,
    candidateId: (row.candidate_id as string | null) ?? null,
    assignedTo: (row.assigned_to as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export type LeadFilter = { status?: LeadStatus | 'all'; topic?: LeadTopic; kind?: LeadKind; q?: string };

export async function listLeads(filter: LeadFilter = {}, limit = 200): Promise<Lead[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  let query = supabase.from('leads').select(LEAD_COLUMNS).order('created_at', { ascending: false }).limit(limit);
  /* Closed conversations are out of the way unless asked for. */
  if (!filter.status) query = query.neq('status', 'closed');
  else if (filter.status !== 'all') query = query.eq('status', filter.status);
  if (filter.topic) query = query.eq('topic', filter.topic);
  if (filter.kind) query = query.eq('kind', filter.kind);
  if (filter.q) {
    const q = filter.q.replace(/[%,()]/g, ' ').trim();
    if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,company.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) console.error('[leads] list failed', error);
  return (data ?? []).map((row) => leadFromRow(row as Record<string, unknown>));
}

export async function getLead(id: string): Promise<{ lead: Lead; events: LeadEvent[] } | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const [{ data: row }, { data: events }] = await Promise.all([
    supabase.from('leads').select(LEAD_COLUMNS).eq('id', id).maybeSingle(),
    supabase
      .from('lead_events')
      .select('id, kind, body, from_status, to_status, actor, created_at')
      .eq('lead_id', id)
      .order('created_at', { ascending: false }),
  ]);
  if (!row) return null;

  return {
    lead: leadFromRow(row as Record<string, unknown>),
    events: (events ?? []).map((e) => ({
      id: Number(e.id),
      kind: e.kind as LeadEvent['kind'],
      body: (e.body as string | null) ?? null,
      fromStatus: (e.from_status as string | null) ?? null,
      toStatus: (e.to_status as string | null) ?? null,
      actor: (e.actor as string | null) ?? null,
      createdAt: String(e.created_at),
    })),
  };
}

/** For the nav badge and the dashboard: conversations nobody has picked up. */
export async function countNewLeads(): Promise<number> {
  const supabase = await getServerSupabase();
  if (!supabase) return 0;
  const { count } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new');
  return count ?? 0;
}
