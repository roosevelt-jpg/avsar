import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { ScorecardForm, UnlockRequestButton } from '@/components/admin/HiringActions';
import { Mono } from '@/components/ui/Mono';
import { STATUS_META } from '@/lib/applications/status';
import { applicantMetrics, listEmployerApplicants, requireEmployerPortal } from '@/lib/employer/portal';
import { interviewTimes } from '@/lib/interviews/time';
import { scoreKinds } from '@/lib/relocation/documents';

export const metadata = { title: 'Applicants' };

/**
 * Applicants to the employer's own postings, from the moment a recruiter
 * shortlists them. Earlier stages, and everyone screened out at them, are not
 * shown: screening is our work, and a rejected applicant's name is not the
 * employer's to see. Contact details are absent on purpose; interviews are
 * arranged through the recruiter.
 *
 * Names are shortened until the employer asks for, and we release, the full
 * profile, so the first read is of the skills. The fit score is a guide with
 * its reasons shown, never a ranking the employer has to accept.
 */
export default async function EmployerApplicants() {
  const portal = await requireEmployerPortal('/admin/applicants', '/admin/applications?status=shortlisted');
  const applicants = (await listEmployerApplicants(portal)).sort((a, b) => b.match.score - a.match.score);
  const metrics = applicantMetrics(applicants);

  return (
    <AdminShell current="/admin/applicants" isStaff={false} suffix="employer">
      <AdminHeading
        title="Applicants"
        lead="Candidates our recruiters have put forward for your vacancies, best fit first. To arrange an interview or ask a question, reply to your recruiter and quote the reference."
        actions={
          applicants.length > 0 && !portal.demo ? (
            <a href="/api/employer/export" download className="rounded-full border border-line-strong bg-surface px-4 py-2 text-[14px] text-ink no-underline">Download CSV</a>
          ) : undefined
        }
      />

      <dl className="m-0 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ['Shortlisted', metrics.shortlisted],
          ['Interviewing', metrics.interviewing],
          ['Offers', metrics.offers],
          ['Hired', metrics.hired],
          ['Visa file ready', metrics.travelReady],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[14px] border border-line bg-surface px-4 py-3">
            <dt><Mono className="text-muted">{String(label).toUpperCase()}</Mono></dt>
            <dd className="m-0 mt-1 text-[24px] font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {applicants.length === 0 ? (
        <AdminEmpty>Nobody shortlisted yet. When a recruiter puts a candidate forward for one of your vacancies, they appear here.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-7 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[980px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                {['Candidate', 'Fit', 'Vacancy', 'English · visa file', 'Stage', 'Next interview'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => {
                const file = scoreKinds(applicant.verifiedDocuments);
                return (
                  <tr key={applicant.applicationId} className="border-b border-line-soft align-top last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium">{applicant.candidateName}</span>
                      <span className="block text-[13px] text-muted">
                        {[applicant.candidatePosition, applicant.candidateCity, applicant.experience].filter(Boolean).join(' · ')}
                      </span>
                      <Mono className="text-[11px] text-muted">{applicant.reference}</Mono>
                      {!applicant.identityReleased && !portal.demo && (
                        <div className="mt-1">
                          <UnlockRequestButton applicationId={applicant.applicationId} pending={applicant.unlockPending} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <details>
                        <summary className="cursor-pointer list-none">
                          <span className="font-mono text-[18px] font-semibold">{applicant.match.score}</span>
                          <span className="text-[12px] text-muted">/100</span>
                        </summary>
                        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-[12px] text-ink-2">
                          {applicant.match.parts.map((p) => (
                            <li key={p.label}>
                              <span className="font-medium">{p.label} {p.points}/{p.max}</span>: {p.reason}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {applicant.jobTitle}
                      <span className="block text-[13px] text-muted">{applicant.jobCity}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {applicant.english ?? 'Not assessed'}
                      <span className="block text-[13px] text-muted">{file.ready ? 'Ready to travel' : `${file.score}/100 verified`}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={STATUS_META[applicant.status].tone === 'success' ? 'success' : 'accent'}>{STATUS_META[applicant.status].label}</Pill>
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {applicant.nextInterviewAt ? (
                        <>
                          {interviewTimes(applicant.nextInterviewAt).lisbon}
                          <span className="block text-[13px] text-muted">{interviewTimes(applicant.nextInterviewAt).india}</span>
                        </>
                      ) : (
                        <span className="text-muted">Not booked</span>
                      )}
                      {['interview', 'offer'].includes(applicant.status) && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[13px] text-employer">Score the interview</summary>
                          <div className="mt-2 min-w-[300px]">
                            <ScorecardForm endpoint="/api/employer/scorecards" extra={{ applicationId: applicant.applicationId }} />
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
