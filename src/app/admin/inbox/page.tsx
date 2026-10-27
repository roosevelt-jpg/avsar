import Link from 'next/link';
import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { LeadImport } from '@/components/admin/LeadImport';
import { Mono } from '@/components/ui/Mono';
import {
  LEAD_KIND_LABELS,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_TONE,
  LEAD_STATUSES,
  LEAD_TOPIC_LABELS,
  LEAD_TOPICS,
  listLeads,
  type LeadStatus,
  type LeadTopic,
} from '@/lib/leads/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'CRM' };

type Search = { status?: string; topic?: string; q?: string };

/**
 * Everyone who has written to us or been handed to us, before they applied.
 * Fee reports are listed first among new messages, because each one may be a
 * candidate about to pay someone who is not us.
 */
export default async function AdminInbox({ searchParams }: { searchParams: Promise<Search> }) {
  await requirePermission('leads.manage', '/admin/inbox');
  const search = await searchParams;
  const status = search.status === 'all' || LEAD_STATUSES.includes(search.status as LeadStatus) ? (search.status as LeadStatus | 'all') : undefined;
  const topic = LEAD_TOPICS.includes(search.topic as LeadTopic) ? (search.topic as LeadTopic) : undefined;

  const leads = (await listLeads({ status, topic, q: search.q })).sort((a, b) => {
    const urgent = (l: typeof a) => (l.topic === 'scam_report' && l.status === 'new' ? 0 : 1);
    return urgent(a) - urgent(b);
  });

  const href = (next: Partial<Search>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...search, ...next })) if (value) params.set(key, value);
    const qs = params.toString();
    return `/admin/inbox${qs ? `?${qs}` : ''}`;
  };
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[13px] no-underline ${active ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2 hover:border-ink'}`;

  return (
    <AdminShell current="/admin/inbox" isStaff>
      <AdminHeading
        title="CRM: leads and messages"
        lead="Everyone who has written to us or been handed to us before applying: the contact form, the employers page, privacy requests and people imported from a partner's list. Open one to reply, add notes and move it from new to contacted, invited and registered. Closed conversations are hidden unless you ask for them."
      />

      <nav aria-label="Status" className="mt-6 flex flex-wrap gap-2">
        <Link href={href({ status: undefined })} className={chip(!status)}>Open work</Link>
        {LEAD_STATUSES.map((value) => (
          <Link key={value} href={href({ status: value })} className={chip(status === value)}>{LEAD_STATUS_LABELS[value]}</Link>
        ))}
        <Link href={href({ status: 'all' })} className={chip(status === 'all')}>Everything</Link>
      </nav>
      <nav aria-label="Topic" className="mt-2 flex flex-wrap gap-2">
        <Link href={href({ topic: undefined })} className={chip(!topic)}>Any topic</Link>
        {LEAD_TOPICS.map((value) => (
          <Link key={value} href={href({ topic: value })} className={chip(topic === value)}>{LEAD_TOPIC_LABELS[value]}</Link>
        ))}
      </nav>

      <form method="get" action="/admin/inbox" className="mt-4 flex flex-wrap gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        {topic && <input type="hidden" name="topic" value={topic} />}
        <input name="q" defaultValue={search.q ?? ''} placeholder="Name, email, phone or company" className="w-[min(100%,340px)] rounded-full border border-line bg-surface px-4 py-2 text-[14px]" />
        <button type="submit" className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper">Search</button>
      </form>

      <LeadImport />

      {leads.length === 0 ? (
        <AdminEmpty>Nothing here. Messages from the contact form arrive the moment they are sent.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-7 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                {['From', 'Topic', 'Message', 'Status', 'Received'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-line-soft align-top last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/inbox/${lead.id}`} className="font-medium text-ink no-underline hover:text-employer">
                      {lead.company ?? lead.fullName}
                    </Link>
                    <span className="block text-[13px] text-muted">
                      {lead.company ? `${lead.fullName} · ` : ''}
                      {LEAD_KIND_LABELS[lead.kind]}
                      {lead.candidateId ? ' · same person as a profile' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={lead.topic === 'scam_report' ? 'accent' : 'neutral'}>{LEAD_TOPIC_LABELS[lead.topic]}</Pill>
                  </td>
                  <td className="max-w-[360px] px-4 py-3 text-ink-2">
                    <span className="line-clamp-2">{lead.message ?? [lead.position, lead.city].filter(Boolean).join(', ')}</span>
                  </td>
                  <td className="px-4 py-3"><Pill tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Pill></td>
                  <td className="px-4 py-3"><Mono className="text-muted">{new Date(lead.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</Mono></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
