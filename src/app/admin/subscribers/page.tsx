import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { Mono } from '@/components/ui/Mono';
import { requirePermission } from '@/lib/rbac/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const metadata = { title: 'Email subscribers' };

type Row = {
  id: string;
  email: string;
  locale: string | null;
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  last_alert_sent_at: string | null;
};

/**
 * People who left their email in the site footer. Read through the staff
 * session, so RLS (leads.manage) is the second check after the page guard.
 */
export default async function AdminSubscribers() {
  await requirePermission('leads.manage', '/admin/subscribers');
  const supabase = await getServerSupabase();
  const { data } = supabase
    ? await supabase
        .from('newsletter_subscribers')
        .select('id, email, locale, source, subscribed_at, unsubscribed_at, last_alert_sent_at')
        .order('subscribed_at', { ascending: false })
        .limit(500)
    : { data: null };
  const rows = (data ?? []) as Row[];
  const active = rows.filter((row) => !row.unsubscribed_at).length;

  return (
    <AdminShell current="/admin/subscribers" isStaff>
      <AdminHeading
        title="Email subscribers"
        lead={`Everyone who asked for new jobs by email from the site footer. ${active} subscribed${rows.length > active ? `, ${rows.length - active} unsubscribed` : ''}. The newest 500 are shown.`}
      />

      {rows.length === 0 ? (
        <AdminEmpty>No one yet. Sign-ups from the footer appear here the moment they are sent.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-7 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                {['Email', 'Language', 'Status', 'Signed up', 'Last alert'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-medium text-ink" dir="ltr">{row.email}</td>
                  <td className="px-4 py-3"><Mono className="text-muted">{(row.locale ?? '-').toUpperCase()}</Mono></td>
                  <td className="px-4 py-3">
                    <Pill tone={row.unsubscribed_at ? 'muted' : 'success'}>{row.unsubscribed_at ? 'Unsubscribed' : 'Subscribed'}</Pill>
                  </td>
                  <td className="px-4 py-3"><Mono className="text-muted">{new Date(row.subscribed_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</Mono></td>
                  <td className="px-4 py-3"><Mono className="text-muted">{row.last_alert_sent_at ? new Date(row.last_alert_sent_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</Mono></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
