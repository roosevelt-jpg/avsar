import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';

export type Newsletter = {
  id: string;
  title: string;
  body: string;
  status: 'draft' | 'sent';
  createdAt: string;
  sentAt: string | null;
  sentCount: number;
  failCount: number;
};

type Row = {
  id: string;
  title: string;
  body: string;
  status: 'draft' | 'sent';
  created_at: string;
  sent_at: string | null;
  sent_count: number;
  fail_count: number;
};

function fromRow(row: Row): Newsletter {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    sentCount: row.sent_count,
    failCount: row.fail_count,
  };
}

/** Public feed: only editions that were actually sent. */
export async function listPublishedNewsletters(limit = 40): Promise<Newsletter[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('newsletters')
    .select('id, title, body, status, created_at, sent_at, sent_count, fail_count')
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[newsletter] list published failed', error.message);
    return [];
  }
  return ((data ?? []) as Row[]).map(fromRow);
}

/** Console history for staff with leads.manage (RLS). */
export async function listNewslettersForStaff(limit = 50): Promise<Newsletter[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('newsletters')
    .select('id, title, body, status, created_at, sent_at, sent_count, fail_count')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[newsletter] list staff failed', error.message);
    return [];
  }
  return ((data ?? []) as Row[]).map(fromRow);
}

export async function countActiveSubscribers(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;
  const { count, error } = await admin
    .from('newsletter_subscribers')
    .select('id', { count: 'exact', head: true })
    .is('unsubscribed_at', null);
  if (error) {
    console.error('[newsletter] subscriber count failed', error.message);
    return 0;
  }
  return count ?? 0;
}
