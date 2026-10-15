import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { Mono } from '@/components/ui/Mono';
import { STATUS_META } from '@/lib/applications/status';
import { listEmployerApplicants, requireEmployerPortal } from '@/lib/employer/portal';
import { interviewTimes } from '@/lib/interviews/time';

export const metadata = { title: 'Applicants' };

/**
 * Applicants to the employer's own postings, from the moment a recruiter
 * shortlists them. Earlier stages, and everyone screened out at them, are not
 * shown: screening is our work, and a rejected applicant's name is not the
 * employer's to see. Contact details are absent on purpose; interviews are
 * arranged through the recruiter.
 */
export default async function EmployerApplicants() {
  const portal = await requireEmployerPortal('/admin/applicants', '/admin/applications?status=shortlisted');
  const applicants = await listEmployerApplicants(portal);

  return (
    <AdminShell current="/admin/applicants" isStaff={false} suffix="employer">
      <AdminHeading
        title="Applicants"
        lead="Candidates our recruiters have put forward for your vacancies. You see an applicant once they are shortlisted. To arrange an interview or ask a question, reply to your recruiter and quote the reference."
      />

      {applicants.length === 0 ? (
        <AdminEmpty>Nobody shortlisted yet. When a recruiter puts a candidate forward for one of your vacancies, they appear here.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-7 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                {['Candidate', 'Vacancy', 'Experience', 'Stage', 'Next interview'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => (
                <tr key={applicant.applicationId} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium">{applicant.candidateName}</span>
                    <span className="block text-[13px] text-muted">
                      {[applicant.candidatePosition, applicant.candidateCity].filter(Boolean).join(' · ')}
                    </span>
                    <Mono className="text-[11px] text-muted">{applicant.reference}</Mono>
                  </td>
                  <td className="px-4 py-3 text-ink-2">
                    {applicant.jobTitle}
                    <span className="block text-[13px] text-muted">{applicant.jobCity}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{applicant.experience}</td>
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
