import { redirect } from 'next/navigation';
import { TalentPoolScreen, parseTalentSearchParams } from '@/components/employer/TalentPoolScreen';
import { getViewer, requireStaffOrEmployer } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Talent pool' };

/**
 * Staff talent search. Employers who land here (old bookmarks, wordmark) are
 * sent to `/admin/employer`, their dedicated home.
 */
export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sector?: string; minEnglish?: string; page?: string }>;
}) {
  const query = await searchParams;
  const viewer = await getViewer();
  if (viewer.role === 'employer') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string' && value) params.set(key, value);
    }
    const qs = params.toString();
    redirect(qs ? `/admin/employer?${qs}` : '/admin/employer');
  }

  const access = await requireStaffOrEmployer('/admin');
  if (access.isStaff) await requirePermission('candidates.view', '/admin');

  const parsed = parseTalentSearchParams(query);
  return <TalentPoolScreen basePath="/admin" isStaff={access.isStaff} {...parsed} />;
}
