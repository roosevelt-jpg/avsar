import type { DashNavKey } from '@/components/candidate/CandidateDashShell';
import { DashboardNav } from '@/components/candidate/DashboardNav';
import { getSiteSettings } from '@/lib/cms/data';
import { getViewer } from '@/lib/auth';
import { savedJobIds } from '@/lib/jobs/saved';
import type { Locale } from '@/lib/i18n';

/**
 * When a candidate is signed in, shopfront pages (CMS, pricing) still need the
 * dashboard chrome — not the marketing header. Staff and employers already live
 * under /admin shells; marketing footer is suppressed separately.
 */
export async function LoggedInShell({
  locale,
  current = 'overview',
  children,
}: {
  locale: Locale;
  current?: DashNavKey;
  children: React.ReactNode;
}) {
  const viewer = await getViewer();
  if (viewer.role !== 'candidate') return <>{children}</>;

  const [settings, saved] = await Promise.all([
    getSiteSettings(),
    savedJobIds(viewer.candidate.id),
  ]);

  return (
    <DashboardNav
      locale={locale}
      current={current}
      candidate={{
        fullName: viewer.candidate.fullName,
        emailConfirmed: viewer.candidate.emailConfirmed,
      }}
      savedCount={saved.size}
      whatsapp={settings.general.whatsapp}
    >
      {children}
    </DashboardNav>
  );
}
