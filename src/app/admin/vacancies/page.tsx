import Link from 'next/link';
import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { VacancyRequestForm } from '@/components/employer/VacancyRequestForm';
import { Mono } from '@/components/ui/Mono';
import { listEmployerVacancies, REQUEST_STATUS_LABELS, requireEmployerPortal } from '@/lib/employer/portal';
import type { JobStatus } from '@/lib/jobs/types';

export const metadata = { title: 'Vacancies' };

const TONE: Record<JobStatus, 'success' | 'neutral' | 'muted' | 'accent'> = {
  draft: 'accent',
  published: 'success',
  closed: 'neutral',
  archived: 'muted',
};

/**
 * The employer's vacancies: what they have asked for and where each stands.
 * Staff are sent to the jobs list filtered to employer requests, which is the
 * same information with the tools to act on it.
 */
export default async function EmployerVacancies() {
  const portal = await requireEmployerPortal('/admin/vacancies', '/admin/jobs?status=requests');
  const vacancies = await listEmployerVacancies(portal);

  return (
    <AdminShell current="/admin/vacancies" isStaff={false} suffix="employer">
      <AdminHeading
        title="Vacancies"
        lead={`The roles you have asked us to fill for ${portal.name}. A recruiter turns each request into a posting, checks it with you, and publishes it; until then candidates cannot see it.`}
      />

      <VacancyRequestForm />

      {vacancies.length === 0 ? (
        <AdminEmpty>No vacancies yet. Send a request above and it appears here.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-7 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[620px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                {['Role', 'People', 'Status', 'Requested'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vacancies.map((vacancy) => (
                <tr key={vacancy.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3">
                    {vacancy.status === 'published' ? (
                      <Link href={`/jobs/${vacancy.slug}`} className="font-medium text-ink no-underline hover:text-employer">{vacancy.title}</Link>
                    ) : (
                      <span className="font-medium">{vacancy.title}</span>
                    )}
                    <span className="block text-[13px] text-muted">{vacancy.city}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{vacancy.openings}</td>
                  <td className="px-4 py-3"><Pill tone={TONE[vacancy.status]}>{REQUEST_STATUS_LABELS[vacancy.status]}</Pill></td>
                  <td className="px-4 py-3">
                    <Mono className="text-muted">{vacancy.requestedAt ? new Date(vacancy.requestedAt).toLocaleDateString('en-GB') : 'Added by us'}</Mono>
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
