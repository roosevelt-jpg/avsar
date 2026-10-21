import { Mono } from '@/components/ui/Mono';
import { siteText } from '@/lib/cms/localize';
import type { CompanySettings } from '@/lib/company/config';
import type { Locale } from '@/lib/i18n';

/**
 * Signup is free. The first price is on the dashboard, after the rewritten CV
 * and the score, so this panel names what costs nothing and does not quote a fee.
 */
export function OrderSummary({
  locale,
  company,
  whatsapp,
}: {
  locale: Locale;
  company?: CompanySettings;
  whatsapp?: string;
}) {
  const t = (english: string) => siteText(locale, english);
  const digits = (whatsapp ?? '').replace(/[^\d]/g, '');
  const lines = [
    t('Account, rewritten CV, test and score'),
    t('Applying, and interviews with us and with the employer'),
    t('After a successful offer: contract, housing, the flight and legal support'),
  ];

  return (
    <aside className="h-fit w-full rounded-[28px] border border-line bg-surface/80 p-[clamp(20px,2.4cqi,26px)] shadow-[0_24px_60px_-28px_rgba(27,26,23,0.35)] backdrop-blur-md lg:w-[340px] lg:shrink-0">
      <Mono className="text-muted">{t('Free to join')}</Mono>
      <p className="mt-3 mb-4 text-[17px] font-semibold">{t('You do not pay to open an account.')}</p>

      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-[14px] leading-[1.5] text-ink-2">
            <span
              aria-hidden
              className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-accent-tint text-[11px] font-semibold text-accent-deep"
            >
              ✓
            </span>
            {line}
          </li>
        ))}
      </ul>

      <p className="m-0 mt-4 border-t border-line-soft pt-4 text-[12px] leading-[1.5] text-muted">
        {t(
          'The only prices are the skills report and the visa-requirements list. You see them after your score, not here. The employer pays the placement fee.',
        )}
      </p>
      {digits ? (
        <p className="m-0 mt-3 text-[12px] leading-[1.5] text-muted">
          {t('Questions')}:{' '}
          <a href={`https://wa.me/${digits}`} className="prose-link" target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          {company?.phone ? ` · ${company.phone}` : ''}.
        </p>
      ) : null}
    </aside>
  );
}
