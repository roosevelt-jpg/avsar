import { NewsletterComposer } from '@/components/admin/NewsletterComposer';
import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { Mono } from '@/components/ui/Mono';
import { countActiveSubscribers, listNewslettersForStaff } from '@/lib/newsletter/data';
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
 * Footer subscribers plus the Resend-powered News & Insights composer.
 * Read through the staff session, so RLS (leads.manage) is the second check
 * after the page guard.
 */
export default async function AdminSubscribers() {
  await requirePermission('leads.manage', '/admin/subscribers');
  const supabase = await getServerSupabase();
  const [{ data }, subscriberCount, letters] = await Promise.all([
    supabase
      ? supabase
          .from('newsletter_subscribers')
          .select('id, email, locale, source, subscribed_at, unsubscribed_at, last_alert_sent_at')
          .order('subscribed_at', { ascending: false })
          .limit(500)
      : Promise.resolve({ data: null }),
    countActiveSubscribers(),
    listNewslettersForStaff(),
  ]);
  const rows = (data ?? []) as Row[];
  const active = rows.filter((row) => !row.unsubscribed_at).length;

  return (
    <AdminShell current="/admin/subscribers" isStaff>
      <AdminHeading
        title="Email subscribers"
        lead={`Everyone who asked for email from the site footer. ${active} subscribed${rows.length > active ? `, ${rows.length - active} unsubscribed` : ''}. Send News & Insights letters below — Resend delivers them.`}
      />

      <NewsletterComposer subscriberCount={subscriberCount} />

      {letters.length > 0 ? (
        <div className="mt-7 rounded-[16px] border border-line bg-surface">
          <div className="border-b border-line px-4 py-3">
            <Mono className="text-muted">SENT LETTERS</Mono>
          </div>
          <ul className="m-0 list-none divide-y divide-line-soft p-0">
            {letters.map((letter) => (
              <li key={letter.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="m-0 font-medium text-ink">{letter.title}</p>
                  <p className="m-0 mt-0.5 text-[13px] text-muted">
                    {letter.sentAt
                      ? new Date(letter.sentAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Draft'}
                    {letter.status === 'sent' ? ` · ${letter.sentCount} sent` : ''}
                    {letter.failCount > 0 ? ` · ${letter.failCount} failed` : ''}
                  </p>
                </div>
                <Pill tone={letter.status === 'sent' ? 'success' : 'muted'}>{letter.status === 'sent' ? 'Sent' : 'Draft'}</Pill>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <AdminEmpty>No one yet. Sign-ups from the footer appear here the moment they are sent.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-7 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                {['Email', 'Language', 'Status', 'Signed up', 'Last alert'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-normal">
                    <Mono className="text-muted">{h.toUpperCase()}</Mono>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-medium text-ink" dir="ltr">
                    {row.email}
                  </td>
                  <td className="px-4 py-3">
                    <Mono className="text-muted">{(row.locale ?? '-').toUpperCase()}</Mono>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={row.unsubscribed_at ? 'muted' : 'success'}>{row.unsubscribed_at ? 'Unsubscribed' : 'Subscribed'}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <Mono className="text-muted">{new Date(row.subscribed_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</Mono>
                  </td>
                  <td className="px-4 py-3">
                    <Mono className="text-muted">
                      {row.last_alert_sent_at
                        ? new Date(row.last_alert_sent_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                        : '—'}
                    </Mono>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
