import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { LeadActions } from '@/components/admin/LeadActions';
import { Mono } from '@/components/ui/Mono';
import { LEAD_KIND_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_TONE, LEAD_TOPIC_LABELS, getLead, type LeadStatus } from '@/lib/leads/data';
import { requirePermission } from '@/lib/rbac/server';
import { isWhatsAppConfigured } from '@/lib/whatsapp';

export const metadata = { title: 'Inbox' };

const EVENT_LABEL = { note: 'Note', email: 'Email sent', whatsapp: 'WhatsApp sent', status: 'Status' } as const;

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requirePermission('leads.manage', `/admin/inbox/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const found = await getLead(id);
  if (!found) notFound();
  const { lead, events } = found;

  const facts: [string, string | null][] = [
    ['Email', lead.email],
    ['Phone', lead.phone ? `${lead.phone}${lead.whatsappOk ? ' · WhatsApp is fine' : ''}` : null],
    ['Company', lead.company],
    ['Role', lead.position],
    ['People needed', lead.openings ? String(lead.openings) : null],
    ['City', lead.city],
    ['Came from', `${LEAD_KIND_LABELS[lead.kind]}${lead.source ? ` · ${lead.source}` : ''}`],
    ['Received', new Date(lead.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })],
    ['Assigned', lead.assignedTo ? (lead.assignedTo === access.userId ? 'You' : 'Another member of staff') : 'Nobody yet'],
  ];

  return (
    <AdminShell current="/admin/inbox" isStaff>
      <p className="m-0 mb-3 text-[14px]"><Link href="/admin/inbox">← Inbox</Link></p>
      <AdminHeading
        title={lead.company ?? lead.fullName}
        actions={
          <>
            <Pill tone={lead.topic === 'scam_report' ? 'accent' : 'neutral'}>{LEAD_TOPIC_LABELS[lead.topic]}</Pill>
            <Pill tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Pill>
          </>
        }
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          {lead.message && (
            <section className="rounded-[16px] border border-line bg-surface p-5">
              <Mono className="text-muted">MESSAGE · {lead.fullName}</Mono>
              <p className="mt-3 mb-0 whitespace-pre-wrap text-[15px] leading-[1.65]">{lead.message}</p>
            </section>
          )}

          <LeadActions
            leadId={lead.id}
            status={lead.status as LeadStatus}
            canEmail={Boolean(lead.email)}
            canWhatsApp={Boolean(lead.phone && lead.whatsappOk)}
            whatsAppConfigured={isWhatsAppConfigured()}
            assignedToMe={lead.assignedTo === access.userId}
          />

          <section>
            <h2 className="m-0 text-[17px] font-semibold">History</h2>
            {events.length === 0 ? (
              <p className="mt-2 mb-0 text-[14px] text-muted">Nothing yet.</p>
            ) : (
              <ol className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
                {events.map((event) => (
                  <li key={event.id} className="rounded-[12px] border border-line-soft bg-surface px-4 py-3">
                    <Mono className="text-muted">
                      {EVENT_LABEL[event.kind]} · {new Date(event.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </Mono>
                    {event.kind === 'status' ? (
                      <p className="mt-1 mb-0 text-[14px]">
                        {LEAD_STATUS_LABELS[event.fromStatus as LeadStatus] ?? event.fromStatus} → {LEAD_STATUS_LABELS[event.toStatus as LeadStatus] ?? event.toStatus}
                      </p>
                    ) : (
                      <p className="mt-1 mb-0 whitespace-pre-wrap text-[14px] leading-[1.6]">{event.body}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-[16px] border border-line bg-surface p-5">
          <dl className="m-0 grid gap-3">
            {facts.filter(([, value]) => value).map(([label, value]) => (
              <div key={label}>
                <dt><Mono className="text-muted">{label.toUpperCase()}</Mono></dt>
                <dd className="m-0 mt-0.5 text-[14px] [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>
          {lead.candidateId && (
            <p className="mt-4 mb-0 text-[14px]">Signed in as a registered candidate when they wrote.</p>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
