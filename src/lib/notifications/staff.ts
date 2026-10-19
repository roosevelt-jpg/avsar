import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { log } from '@/lib/observability/log';
import { getMailer } from '@/lib/email';
import { composeEmail } from '@/lib/email/compose';
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

/**
 * Who hears about things by email: a comma-separated list in
 * STAFF_ALERT_EMAILS, or the older single STAFF_ALERT_EMAIL.
 */
export function staffAlertRecipients(): string[] {
  const raw = process.env.STAFF_ALERT_EMAILS ?? process.env.STAFF_ALERT_EMAIL ?? '';
  return raw
    .split(',')
    .map((address) => address.trim())
    .filter((address) => address.includes('@'));
}

/**
 * The owner asked to be emailed about new applications and payments, not only
 * to see them on the bell, because nobody watches the console all day. Optional
 * (no recipients, no email) and never throws: the action that triggered it has
 * already happened.
 */
export async function emailStaff(input: { subject: string; line: string; href: string; actionLabel: string; origin?: string }): Promise<void> {
  const recipients = staffAlertRecipients();
  if (recipients.length === 0) return;
  const origin = input.origin ?? process.env.SITE_ORIGIN ?? 'https://recruitment.smithandadams.com';
  const url = `${origin}${input.href}`;
  const mailer = getMailer();
  for (const to of recipients) {
    try {
      const email = await composeEmail(
        'staff_alert',
        { subject: input.subject, line: input.line, action_label: input.actionLabel },
        { origin, actionUrl: url },
      );
      await mailer.send({ to, ...email });
    } catch (error) {
      log.warn('notifications.email_failed', { subject: input.subject, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

/**
 * The latest notifications this person may see, and when they last looked.
 * Read through the session client, so RLS filters by permission.
 */
export async function listStaffNotifications(userId: string, limit = 50): Promise<{ items: StaffNotification[]; seenAt: string | null }> {
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
  const supabase = await getServerSupabase();
  if (!supabase) return 0;
  const { data: seen } = await supabase.from('staff_notification_seen').select('seen_at').eq('user_id', userId).maybeSingle();
  let query = supabase.from('staff_notifications').select('id', { count: 'exact', head: true });
  if (seen?.seen_at) query = query.gt('created_at', String(seen.seen_at));
  const { count } = await query;
  return count ?? 0;
}
