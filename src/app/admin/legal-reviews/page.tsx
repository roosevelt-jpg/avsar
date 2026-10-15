import Link from 'next/link';
import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { BackgroundSummary } from '@/components/admin/BackgroundSummary';
import { LegalReviewForm } from '@/components/admin/LegalReviewForm';
import { Mono } from '@/components/ui/Mono';
import { positionLabel } from '@/lib/data/positions';
import { legalReviewQueue } from '@/lib/legal/review';
import { requirePermission } from '@/lib/rbac/server';
import { DOCUMENT_LABELS } from '@/lib/relocation/documents';

export const metadata = { title: 'Legal reviews' };

const STATUS_PILL = {
  none: { tone: 'accent', label: 'Not started' },
  draft: { tone: 'muted', label: 'Draft' },
  delivered: { tone: 'success', label: 'Delivered' },
} as const;

/**
 * Every buyer of the package is owed a preliminary legal review of the
 * documents they provided. This is the list of who is still waiting, oldest
 * first, so nobody who paid is forgotten.
 */
export default async function AdminLegalReviews() {
  await requirePermission('relocation.manage', '/admin/legal-reviews');
  const queue = await legalReviewQueue();
  const waiting = queue.filter((item) => item.status !== 'delivered').length;

  return (
    <AdminShell current="/admin/legal-reviews" isStaff>
      <AdminHeading
        title="Legal reviews"
        lead={`Preliminary legal due diligence for everyone who bought the package. ${waiting} waiting. Review the documents on the relocation page, write the four parts, then deliver: the candidate is emailed and reads it on their dashboard. It is a preliminary review, never a promise about a visa.`}
      />
      {queue.length === 0 ? (
        <AdminEmpty>Nobody has bought the package yet.</AdminEmpty>
      ) : (
        <ul className="m-0 mt-7 flex list-none flex-col gap-3 p-0">
          {queue.map((item) => (
            <li key={item.candidateId} className="rounded-[16px] border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{item.candidateName}</span>
                {item.position && <span className="text-ink-2">{positionLabel(item.position)}</span>}
                <Pill tone={STATUS_PILL[item.status].tone}>{STATUS_PILL[item.status].label}</Pill>
                {item.paidAt && <Mono className="ms-auto text-muted">Paid {new Date(item.paidAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</Mono>}
              </div>
              <p className="m-0 mt-2 text-[13px] text-ink-2">
                Documents on file:{' '}
                {item.documents.length === 0
                  ? 'none yet. Ask the candidate to upload their passport or ID.'
                  : item.documents.map((d) => `${DOCUMENT_LABELS[d.kind] ?? d.kind} (${d.status})`).join(', ')}
                {' · '}
                <Link href="/admin/relocation" className="prose-link">Review documents</Link>
              </p>
              {item.status === 'delivered' ? (
                <p className="m-0 mt-2 text-[13px] text-muted">
                  Delivered {item.deliveredAt ? new Date(item.deliveredAt).toLocaleDateString('en-GB', { dateStyle: 'medium' }) : ''}.
                </p>
              ) : (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[14px] font-medium">{item.status === 'draft' ? 'Continue the review' : 'Write the review'}</summary>
                  <div className="mt-3 max-w-[620px]">
                    <BackgroundSummary background={item.background} />
                  </div>
                  <LegalReviewForm
                    candidateId={item.candidateId}
                    initial={{ summary: item.summary, requirements: item.requirements, missingDocuments: item.missingDocuments, issues: item.issues }}
                  />
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
