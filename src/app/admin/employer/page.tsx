import {
  ActiveJobsPanel,
  EmployerDashHero,
  EmployerRelocationPromo,
  EmployerStatStrip,
  HiringFunnelPanel,
  RecentApplicationsPanel,
  UpcomingInterviewsPanel,
  buildEmployerDashStats,
} from '@/components/employer/EmployerDashboardOverview';
import { TalentPoolScreen, parseTalentSearchParams } from '@/components/employer/TalentPoolScreen';
import { assessedCount } from '@/lib/company/data';
import {
  listEmployerApplicants,
  listEmployerVacancies,
  requireEmployerPortal,
} from '@/lib/employer/portal';

export const metadata = { title: 'Employer · Dashboard' };

/**
 * Employer home after sign-in: mockup overview (live counts) then the talent
 * search desk employers already use.
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
  const stats = buildEmployerDashStats(vacancies, applicants);

  return (
    <TalentPoolScreen
      basePath="/admin/employer"
      isStaff={false}
      {...parsed}
      intro={
        <div className="mb-10 flex flex-col gap-5">
          <EmployerDashHero companyName={portal.name} />
          <EmployerStatStrip stats={stats} />
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.95fr_0.85fr]">
            <RecentApplicationsPanel applicants={applicants} />
            <HiringFunnelPanel applicants={applicants} />
            <EmployerRelocationPromo />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ActiveJobsPanel vacancies={vacancies} applicants={applicants} />
            <UpcomingInterviewsPanel applicants={applicants} />
          </div>
          <p className="m-0 text-[13px] text-[#5c7084]">
            {assessed.toLocaleString('en-GB')} people have finished the skills test in the pool below. Shortlist who
            fits; we introduce you.
          </p>
        </div>
      }
    />
  );
}
