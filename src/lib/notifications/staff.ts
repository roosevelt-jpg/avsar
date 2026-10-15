import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { log } from '@/lib/observability/log';
import type { Permission } from '@/lib/rbac/permissions';

/**
 * The console bell.
 *
 * Something happened that a member of staff should look at: a new
 * application, a vacancy request, a message in the inbox. Each notification
 * names the permission needed to see it, so the bell of a content editor
 * stays quiet about applications, and RLS (`staff_notifications_read`)
 * enforces the same rule when the list is read.
 */

export type StaffNotification = {
  id: number;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string;
};

/** Never throws: a missed bell is not worth failing the action that rang it. */
export async function notifyStaff(input: {
  permission: Permission;
  kind: string;
  title: string;
  body?: string;
  href?: string;
}): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;
  const { error } = await admin.from('staff_notifications').insert({
    permission: input.permission,
    kind: input.kind,
    title: input.title.slice(0, 200),
    body: input.body?.slice(0, 1000) ?? null,
    href: input.href?.startsWith('/admin') ? input.href : null,
  });
  if (error) log.warn('notifications.insert_failed', { kind: input.kind, error: error.message });
}

const SAMPLE: StaffNotification[] = [
  { id: 3, kind: 'application.new', title: 'New application: Line cook, Albufeira', body: 'APP-7K3Q9D2F', href: '/admin/applications', createdAt: '2026-10-15T09:20:00.000Z' },
  { id: 2, kind: 'lead.contact', title: 'New message: question about the visa', body: 'From Ravi Kumar', href: '/admin/inbox', createdAt: '2026-10-15T08:05:00.000Z' },
  { id: 1, kind: 'vacancy.request', title: 'Vacancy request: Housekeeping attendant, Albufeira', body: 'Sample hotel group', href: '/admin/jobs?status=requests', createdAt: '2026-10-14T16:40:00.000Z' },
];

/**
 * The latest notifications this person may see, and when they last looked.
 * Read through the session client, so RLS filters by permission.
 */
export async function listStaffNotifications(userId: string, limit = 50): Promise<{ items: StaffNotification[]; seenAt: string | null }> {
  if (!isSupabaseConfigured()) return { items: SAMPLE, seenAt: '2026-10-15T08:30:00.000Z' };
  const supabase = await getServerSupabase();
  if (!supabase) return { items: [], seenAt: null };
  const [{ data }, { data: seen }] = await Promise.all([
    supabase.from('staff_notifications').select('id, kind, title, body, href, created_at').order('created_at', { ascending: false }).limit(limit),
    supabase.from('staff_notification_seen').select('seen_at').eq('user_id', userId).maybeSingle(),
  ]);
  return {
    items: (data ?? []).map((row) => ({
      id: Number(row.id),
      kind: String(row.kind),
      title: String(row.title),
      body: (row.body as string | null) ?? null,
      href: (row.href as string | null) ?? null,
      createdAt: String(row.created_at),
    })),
    seenAt: (seen?.seen_at as string | undefined) ?? null,
  };
}

/** How many notifications arrived since this person last opened the list. */
export async function unseenCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 1;
  const supabase = await getServerSupabase();
  if (!supabase) return 0;
  const { data: seen } = await supabase.from('staff_notification_seen').select('seen_at').eq('user_id', userId).maybeSingle();
  let query = supabase.from('staff_notifications').select('id', { count: 'exact', head: true });
  if (seen?.seen_at) query = query.gt('created_at', String(seen.seen_at));
  const { count } = await query;
  return count ?? 0;
}
