import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { BenchHold } from '@/components/admin/BenchHold';
import { Mono } from '@/components/ui/Mono';
import { positionLabel } from '@/lib/data/positions';
import { listBench, requireEmployerPortal } from '@/lib/employer/portal';
import { DOCUMENT_LABELS, type DocumentKind } from '@/lib/relocation/documents';

export const metadata = { title: 'Ready to travel' };

/**
 * Candidates who could start soonest: assessed, with their passport and
 * police clearance already checked by us. Holding one tells our team to call
 * this employer first; it does not take the candidate off the market, and it
 * lapses after three days.
 */
export default async function EmployerBench() {
  const portal = await requireEmployerPortal('/admin/bench', '/admin/relocation');
  const bench = await listBench(portal);

  return (
    <AdminShell current="/admin/bench" isStaff={false} suffix="employer">
      <AdminHeading
        title="Ready to travel"
        lead="Assessed candidates whose passport and police clearance we have already verified, so a visa application can start as soon as there is a contract. Hold someone for three days while you decide; we will be in touch."
      />
      {bench.length === 0 ? (
        <AdminEmpty>Nobody on the bench right now. Candidates appear here as soon as their documents are verified.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-7 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[820px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                {['Candidate', 'English', 'Assessment', 'Verified', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bench.map((c) => (
                <tr key={c.candidateId} className="border-b border-line-soft align-top last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium">{c.name}</span>
                    <span className="block text-[13px] text-muted">
                      {[c.position ? positionLabel(c.position) : null, c.city, c.yearsExperience != null ? `${c.yearsExperience}+ years` : null].filter(Boolean).join(' · ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.english ?? '-'}</td>
                  <td className="px-4 py-3"><Mono>{c.overallScore ?? '-'}</Mono></td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      {c.verifiedDocuments.map((k) => (
                        <Pill key={k} tone="success">{DOCUMENT_LABELS[k as DocumentKind] ?? k}</Pill>
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {portal.demo ? (
                      <span className="text-[13px] text-muted">{c.heldByMe ? 'Held by you' : 'Preview'}</span>
                    ) : (
                      <BenchHold candidateId={c.candidateId} heldByMe={c.heldByMe} heldByOther={Boolean(c.heldUntil) && !c.heldByMe} />
                    )}
                    {c.heldByMe && c.heldUntil && (
                      <Mono className="mt-1 block text-[11px] text-muted">until {new Date(c.heldUntil).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</Mono>
                    )}
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
