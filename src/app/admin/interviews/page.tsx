import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { Mono } from '@/components/ui/Mono';
import { STATUS_META } from '@/lib/applications/status';
import { listEmployerApplicants, listScheduledApplicantInterviews, requireEmployerPortal } from '@/lib/employer/portal';

export const metadata = { title: 'Interviews' };

/**
 * Employer Interviews workspace from the HTML-44 pack. Scheduling stays with
 * staff; employers see upcoming interview times on their shortlisted pool.
 */
export default async function EmployerInterviewsPage() {
  await requireEmployerPortal('/admin/interviews', '/admin/applications?status=interview');
  const applicants = await listEmployerApplicants();
  const interviews = listScheduledApplicantInterviews(applicants);

  return (
    <AdminShell current="/admin/interviews" isStaff={false} suffix="employer">
      <AdminHeading
        title="Interviews"
        lead="Upcoming interviews for candidates our recruiters have put forward. To reschedule or ask a question, reply to your recruiter with the reference."
      />

      <div className="sa-kpis mt-6">
        <div className="sa-kpi">
          <strong>{interviews.length}</strong>
          <span>Scheduled</span>
        </div>
        <div className="sa-kpi">
          <strong>{applicants.filter((a) => a.status === 'interview').length}</strong>
          <span>In interview stage</span>
        </div>
        <div className="sa-kpi">
          <strong>{applicants.filter((a) => a.status === 'shortlisted').length}</strong>
          <span>Shortlisted</span>
        </div>
        <div className="sa-kpi">
          <strong>{applicants.filter((a) => a.status === 'offer').length}</strong>
          <span>Offers</span>
        </div>
      </div>

      {interviews.length === 0 ? (
        <AdminEmpty>
          No interviews scheduled yet. When a recruiter books an interview for one of your applicants, it will appear here.
        </AdminEmpty>
      ) : (
        <div className="sa-tablewrap mt-4">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Candidate</th>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Role</th>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">When</th>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Status</th>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Reference</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((row) => (
                <tr key={row.applicationId} className="border-t border-[#e9edf2]">
                  <td className="px-4 py-3 font-semibold text-[#142438]">{row.candidateName}</td>
                  <td className="px-4 py-3 text-[#5c7084]">
                    {row.jobTitle} · {row.jobCity}
                  </td>
                  <td className="px-4 py-3 text-[#5c7084]">
                    {row.nextInterviewAt ? new Date(row.nextInterviewAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={STATUS_META[row.status].tone === 'success' ? 'success' : 'accent'}>
                      {STATUS_META[row.status].label}
                    </Pill>
                  </td>
                  <td className="px-4 py-3">
                    <Mono>{row.reference}</Mono>
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
