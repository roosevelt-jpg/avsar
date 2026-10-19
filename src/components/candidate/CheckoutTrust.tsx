import type { CompanySettings } from '@/lib/company/config';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';

/** Seller identity, receipt and refund beside the package pay button. */
export function CheckoutTrust({
  locale,
  company,
  whatsapp,
  supportEmail,
}: {
  locale: Locale;
  company: CompanySettings;
  whatsapp: string;
  supportEmail: string;
}) {
  const t = (english: string) => siteText(locale, english);
  const digits = whatsapp.replace(/[^\d]/g, '');
  const seller = company.tradingAs || company.legalName;

  return (
    <div className="mt-5 rounded-[14px] border border-line-soft bg-paper/80 p-4 text-[13px] leading-[1.55] text-ink-2">
      <p className="m-0 font-medium text-ink">{t('You are paying')}</p>
      <p className="m-0 mt-1">
        {seller}
        {company.legalName && company.legalName !== seller ? ` (${company.legalName})` : ''}
      </p>
      {company.registeredAddress ? <p className="m-0 mt-1">{company.registeredAddress}</p> : null}
      <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
        <li>{t('You get a receipt by email. Statement may show')}: {company.statementDescriptor || seller}.</li>
        <li>
          {t(
            'Refund: within 14 days if you have not downloaded the report or CV. After a download, the preliminary legal review is still owed.',
          )}
        </li>
        <li>{t('Never pay cash, never by WhatsApp transfer, never to an agent.')}</li>
      </ul>
      <p className="m-0 mt-3">
        {t('Questions?')}{' '}
        {digits ? (
          <a href={`https://wa.me/${digits}`} className="prose-link" target="_blank" rel="noreferrer">
            {t('WhatsApp')} {whatsapp}
          </a>
        ) : null}
        {digits && supportEmail ? ' · ' : null}
        {supportEmail ? (
          <a href={`mailto:${supportEmail}`} className="prose-link">
            {supportEmail}
          </a>
        ) : null}
      </p>
    </div>
  );
}
