import { CandidateDashShell, type DashNavKey } from '@/components/candidate/CandidateDashShell';
import type { Locale } from '@/lib/i18n';

/**
 * Back-compat wrapper: older dashboard pages imported DashboardNav as a
 * header-only bar. The mockup shell wraps the whole page; pass children.
 */
export async function DashboardNav({
  locale,
  current,
  candidate,
  savedCount = 0,
  whatsapp = '',
  children,
}: {
  locale: Locale;
  current: DashNavKey;
  candidate: { fullName: string; emailConfirmed: boolean };
  savedCount?: number;
  whatsapp?: string;
  children: React.ReactNode;
}) {
  return (
    <CandidateDashShell
      locale={locale}
      current={current}
      candidate={candidate}
      savedCount={savedCount}
      whatsapp={whatsapp}
    >
      {children}
    </CandidateDashShell>
  );
}
