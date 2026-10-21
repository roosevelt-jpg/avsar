import { Mono } from '@/components/ui/Mono';
import { ScoreShareCard } from '@/components/candidate/ScoreShareCard';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';

/**
 * Free teaser after the assessment: score axes only (no AI narrative).
 * Highest two axes as strengths, lowest as the gap; the rest is blurred so
 * the paid report and pack still feel like a unlock, not a re-read.
 */
export function ReportPreview({
  locale,
  overall,
  breakdown,
  shortlistMin,
  price,
  bundle,
}: {
  locale: Locale;
  overall: number;
  breakdown: { label: string; score: number }[];
  shortlistMin: number;
  price: string;
  bundle: string;
}) {
  const t = (english: string) => siteText(locale, english);
  const sorted = [...breakdown].filter((a) => a.label).sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 2);
  const gap = sorted.length > 0 ? sorted[sorted.length - 1]! : null;
  const threshold = shortlistMin / 10;
  const overallOutOf10 = (overall / 10).toFixed(overall % 10 === 0 ? 0 : 1);
  const shortlistLine =
    overall >= shortlistMin
      ? t(`Your score is above the shortlist threshold (${threshold} out of 10).`)
      : t(`Your score is below the shortlist threshold (${threshold} out of 10). Applying is still free.`);

  return (
    <section className="mb-8 rounded-[20px] border border-line bg-surface p-[clamp(20px,3cqi,28px)]">
      <Mono className="text-muted">{t('Your free score preview')}</Mono>
      <h2 className="mt-2.5 mb-2 text-[clamp(20px,2.6cqi,26px)] font-semibold leading-[1.15]">
        {t('Score')}: {overallOutOf10} / 10
      </h2>
      <p className="m-0 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">{shortlistLine}</p>
      <ScoreShareCard
        scoreOutOf10={overallOutOf10}
        above={overall >= shortlistMin}
        thresholdLabel={`${threshold} out of 10`}
      />

      {strengths.length > 0 ? (
        <ul className="m-0 mt-5 flex list-none flex-col gap-2.5 p-0">
          {strengths.map((axis) => (
            <li key={axis.label} className="text-[15px] leading-[1.5] text-ink">
              <span className="font-medium text-accent-deep">{t('Strength')}</span>
              {': '}
              {axis.label} ({axis.score}/100)
            </li>
          ))}
          {gap && gap.label !== strengths[0]?.label ? (
            <li className="text-[15px] leading-[1.5] text-ink">
              <span className="font-medium text-accent-deep">{t('To improve')}</span>
              {': '}
              {gap.label} ({gap.score}/100)
            </li>
          ) : null}
        </ul>
      ) : null}

      {strengths[0] ? (
        <p className="m-0 mt-4 max-w-[62ch] text-[15px] leading-[1.6] text-ink">
          {t('Strongest field')}: {strengths[0].label}. {t('The skills report leads with this, so an employer reads it first. The PDF is what you pay for. This score is free.')}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <a
          href="#package"
          className="t-colors inline-flex rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper no-underline hover:bg-ink-hover"
        >
          {t('Skills report')} · {price}
        </a>
        <a
          href="#package"
          className="t-colors inline-flex rounded-full border border-line-strong bg-surface px-5 py-2.5 text-[14px] font-semibold text-ink no-underline hover:border-ink"
        >
          {t('Both reports')} · {bundle}
        </a>
      </div>
    </section>
  );
}
