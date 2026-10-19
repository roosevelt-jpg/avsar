import { EmployerWelcome } from '@/components/employer/EmployerWelcome';
import { TalentPoolScreen, parseTalentSearchParams } from '@/components/employer/TalentPoolScreen';
import { assessedCount } from '@/lib/company/data';
import {
  listEmployerApplicants,
  listEmployerVacancies,
  requireEmployerPortal,
} from '@/lib/employer/portal';

export const metadata = { title: 'Employer · Talent pool' };

/**
 * Employer home after sign-in. Welcome desk on top, talent search underneath.
 */
export default async function EmployerHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sector?: string; minEnglish?: string; page?: string }>;
}) {
  const portal = await requireEmployerPortal('/admin/employer', '/admin');
  const query = await searchParams;
  const parsed = parseTalentSearchParams(query);

  const [vacancies, applicants, assessed] = await Promise.all([
    listEmployerVacancies(portal),
    listEmployerApplicants(),
    assessedCount(),
  ]);

  return (
    <TalentPoolScreen
      basePath="/admin/employer"
      isStaff={false}
      {...parsed}
      intro={
        <EmployerWelcome
          companyName={portal.name}
          vacancyCount={vacancies.length}
          applicantCount={applicants.length}
          assessed={assessed}
        />
      }
    />
  );
}
