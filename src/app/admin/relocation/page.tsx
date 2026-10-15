import Link from 'next/link';
import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { DocumentReview, StoryReview } from '@/components/admin/RelocationActions';
import { Mono } from '@/components/ui/Mono';
import { requirePermission } from '@/lib/rbac/server';
import { relocationQueue } from '@/lib/relocation/data';
import { DOCUMENT_LABELS } from '@/lib/relocation/documents';
import { milestoneTemplate } from '@/lib/relocation/milestones';

export const metadata = { title: 'Relocation' };

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { dateStyle: 'medium' });

/**
 * The relocation team's day: documents waiting for a check, steps that have
 * slipped past their date, and stories waiting to be read. Each list is the
 * oldest first, because the oldest is the one a candidate is waiting on.
 */
export default async function AdminRelocation() {
  await requirePermission('relocation.manage', '/admin/relocation');
  const queue = await relocationQueue();

  return (
    <AdminShell current="/admin/relocation" isStaff>
      <AdminHeading
        title="Relocation"
        lead="Check visa documents, chase steps that have slipped, and publish stories from people who have made the move. Plans are started from an application at offer stage."
      />

      <section className="mt-8">
        <h2 className="m-0 text-[19px] font-semibold">Documents to check ({queue.documents.length})</h2>
        {queue.documents.length === 0 ? (
          <AdminEmpty>Nothing waiting. New uploads appear here straight away.</AdminEmpty>
        ) : (
          <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
            {queue.documents.map((doc) => (
              <li key={doc.id} className="rounded-[16px] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">{doc.candidateName}</span>
                  <Pill tone="neutral">{DOCUMENT_LABELS[doc.kind]}</Pill>
                  <Mono className="text-muted">{day(doc.createdAt)}</Mono>
                  <a href={`/api/admin/relocation/documents/${doc.id}`} target="_blank" rel="noreferrer" className="ms-auto text-[14px]">
                    Open {doc.fileName}
                  </a>
                </div>
                <DocumentReview id={doc.id} kind={doc.kind} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {queue.expiring.length > 0 && (
        <section className="mt-10">
          <h2 className="m-0 text-[19px] font-semibold">Expiring within 30 days ({queue.expiring.length})</h2>
          <p className="mt-1 mb-0 text-[14px] text-ink-2">Ask for a new copy before it runs out; an expired document at the visa centre means a new appointment.</p>
          <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 text-[14px]">
            {queue.expiring.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-line bg-surface px-4 py-2.5">
                <span className="font-medium">{doc.candidateName}</span>
                <Pill tone="accent">{DOCUMENT_LABELS[doc.kind]}</Pill>
                <Mono className="text-muted">expires {doc.expiresOn ? day(doc.expiresOn) : ''}</Mono>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="m-0 text-[19px] font-semibold">Steps past their date ({queue.overdue.length})</h2>
        {queue.overdue.length === 0 ? (
          <AdminEmpty>Every plan is on schedule.</AdminEmpty>
        ) : (
          <div className="scroll-x mt-4 rounded-[16px] border border-line bg-surface">
            <table className="w-full min-w-[680px] border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-line">
                  {['Candidate', 'Step', 'Was due', 'Waiting for'].map((h) => (
                    <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queue.overdue.map((m) => {
                  const template = milestoneTemplate(m.key);
                  return (
                    <tr key={m.id} className="border-b border-line-soft align-top last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/admin/applications/${m.applicationId}`} className="font-medium text-ink no-underline hover:text-employer">{m.candidateName}</Link>
                        <Mono className="block text-muted">{m.reference}</Mono>
                      </td>
                      <td className="px-4 py-3">
                        {template?.label ?? m.key}
                        {template?.arrival && <Pill tone="accent">Arrival</Pill>}
                      </td>
                      <td className="px-4 py-3"><Mono>{m.dueOn ? day(m.dueOn) : ''}</Mono></td>
                      <td className="px-4 py-3 text-ink-2">{m.blocker ?? 'Nothing recorded'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="m-0 text-[19px] font-semibold">Stories to read ({queue.stories.length})</h2>
        {queue.stories.length === 0 ? (
          <AdminEmpty>No stories waiting.</AdminEmpty>
        ) : (
          <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
            {queue.stories.map((story) => (
              <li key={story.id} className="rounded-[16px] border border-line bg-surface p-4">
                <blockquote className="m-0 text-[16px] leading-[1.6]">“{story.quote}”</blockquote>
                <p className="mt-2 mb-0 text-[14px] text-ink-2">
                  {story.displayName} · {story.roleLabel}
                  {story.cityLabel ? `, ${story.cityLabel}` : ''} <span className="text-muted">(from {story.candidateName}, {day(story.createdAt)})</span>
                </p>
                <StoryReview id={story.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
