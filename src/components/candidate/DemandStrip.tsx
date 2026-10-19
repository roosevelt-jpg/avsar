import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n';
import { per100, type FunnelStats } from '@/lib/stats/funnel-shared';

/** Open roles and live funnel numbers on the candidate dashboard. */
export function DemandStrip({
  locale,
  jobCount,
  titles,
  funnel,
  minSample = 20,
}: {
  locale: Locale;
  jobCount: number;
  titles: string[];
  funnel: FunnelStats;
  minSample?: number;
}) {
  const t = (english: string) => siteText(locale, english);
  const enough = funnel.completed >= minSample;

  return (
    <section className="mb-8 rounded-[20px] border border-line bg-surface/90 p-[clamp(18px,2.5cqi,24px)]">
      <Mono className="text-muted">{t('Hiring now')}</Mono>
      <h2 className="mt-2 mb-1 text-[19px] font-semibold tracking-[-0.02em]">
        {jobCount === 0
          ? t('New roles are posted regularly')
          : jobCount === 1
            ? t('1 open role on the board')
            : t(`${jobCount} open roles on the board`)}
      </h2>
      {titles.length > 0 ? (
        <p className="m-0 text-[14px] leading-[1.55] text-ink-2">{titles.join(' · ')}</p>
      ) : (
        <p className="m-0 text-[14px] leading-[1.55] text-ink-2">
          {t('Browse the jobs board for current titles, cities and what is included.')}
        </p>
      )}

      {enough ? (
        <p className="m-0 mt-3 text-[13px] leading-[1.55] text-muted">
          {t(
            `Among people who finished the test: ${per100(funnel.qualified, funnel.completed)}/100 above the shortlist score, ${per100(funnel.shortlisted, funnel.completed)}/100 shortlisted, ${per100(funnel.hired, funnel.completed)}/100 hired. Past results, not a promise for you.`,
          )}
        </p>
      ) : (
        <p className="m-0 mt-3 text-[13px] leading-[1.55] text-muted">
          {t('Live selection figures appear here once enough candidates have finished the test.')}
        </p>
      )}

      <Link
        href={localePath(locale, '/jobs')}
        className="t-colors mt-4 inline-flex rounded-full border border-line-strong px-4 py-2 text-[14px] font-medium text-ink no-underline hover:border-ink"
      >
        {t('See open jobs')}
      </Link>
    </section>
  );
}
