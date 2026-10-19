import { TalentPoolScreen, parseTalentSearchParams } from '@/components/employer/TalentPoolScreen';
import { requireEmployerPortal } from '@/lib/employer/portal';

export const metadata = { title: 'Employer · Talent pool' };

/**
 * Employer home after sign-in. Same talent search as staff `/admin`, under a
 * dedicated path so the address bar reads as the employer portal.
 */
export default async function EmployerHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sector?: string; minEnglish?: string; page?: string }>;
}) {
  await requireEmployerPortal('/admin/employer', '/admin');
  const query = await searchParams;
  const parsed = parseTalentSearchParams(query);
  return <TalentPoolScreen basePath="/admin/employer" isStaff={false} {...parsed} />;
}
