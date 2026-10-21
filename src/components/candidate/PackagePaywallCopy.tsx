import { siteText } from '@/lib/cms/localize';
import type { ConversionSettings } from '@/lib/cms/settings';
import { applyTokens } from '@/lib/cms/tokens';
import type { HiringSettings } from '@/lib/company/config';
import type { Locale } from '@/lib/i18n';

/**
 * Trust lines, deliverables and historical odds beside every package pay CTA.
 * Wording comes from Settings › Conversion; odds from Company › hiring.
 */
export function PackagePaywallCopy({
  locale,
  conversion,
  hiring,
  shortlistLabel,
}: {
  locale: Locale;
  conversion: ConversionSettings;
  hiring: HiringSettings;
  /** Already formatted, e.g. "7.0 out of 10". */
  shortlistLabel: string;
}) {
  const t = (english: string) => siteText(locale, english);
  const sla = {
    report_days: String(hiring.reportWithinDays),
    legal_review_days: String(hiring.legalReviewWithinDays),
  };

  return (
    <div className="mt-5 flex flex-col gap-5">
      {conversion.deliverables.length > 0 ? (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {conversion.deliverables.map((item) => (
            <li key={item.title} className="rounded-[14px] border border-line bg-surface/80 p-3.5">
              <p className="m-0 text-[14px] font-semibold text-ink">{t(applyTokens(item.title, sla))}</p>
              <p className="m-0 mt-1.5 text-[13px] leading-[1.55] text-ink-2">{t(applyTokens(item.timing, sla))}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {conversion.trustLines.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {conversion.trustLines.map((line) => (
            <li key={line} className="flex gap-2 text-[13px] leading-[1.55] text-ink-2">
              <span aria-hidden className="text-accent-deep">
                ✓
              </span>
              <span>{t(line)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="m-0 max-w-[62ch] text-[13px] leading-[1.6] text-muted">
        {t(
          `Optional. A score above ${shortlistLabel} is what qualifies you for the shortlist. Buying a report does not change that, and it does not guarantee an interview, a job or a visa. Visa decisions are made only by the authorities.`,
        )}
      </p>

      {hiring.outcomeVisible ? (
        <p className="m-0 max-w-[62ch] text-[13px] leading-[1.6] text-muted">
          {t(
            `Historical average: about ${hiring.outcomeHired} of every ${hiring.outcomeShortlisted} shortlisted candidates hired.`,
          )}{' '}
          {t(hiring.outcomeBasis)}
        </p>
      ) : null}
    </div>
  );
}
