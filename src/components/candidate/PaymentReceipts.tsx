import { Mono } from '@/components/ui/Mono';
import { formatMoney, type ChargeCurrency } from '@/lib/company/config';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import {
  receiptCurrency,
  receiptMethodLabel,
  receiptProductLabel,
  type CandidateReceipt,
} from '@/lib/payments/receipts';

/**
 * On-dashboard receipts for paid reports.
 *
 * The email is still the formal copy; this is so the candidate can find the
 * receipt number and amount without digging through inbox search.
 */
export function PaymentReceipts({
  locale,
  receipts,
  chargeCurrency,
  highlight,
}: {
  locale: Locale;
  receipts: CandidateReceipt[];
  chargeCurrency: ChargeCurrency;
  /** After return from checkout, scroll/focus the newest receipt. */
  highlight?: boolean;
}) {
  if (receipts.length === 0) return null;

  return (
    <section
      id="receipt"
      className={`mb-6 scroll-mt-24 rounded-[16px] border border-line bg-surface p-[clamp(20px,3cqi,28px)] ${
        highlight ? 'border-[#b28a49] bg-[#b28a49]/08' : ''
      }`}
    >
      <Mono className="text-accent-deep">{siteText(locale, 'Your receipts')}</Mono>
      <h2 className="mt-2.5 mb-1 text-[clamp(20px,2.6cqi,26px)] font-semibold leading-[1.15]">
        {siteText(locale, 'Payment receipt')}
      </h2>
      <p className="m-0 mb-5 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
        {siteText(
          locale,
          'A copy was also sent to your email. Keep the receipt number if you write to us about this payment.',
        )}
      </p>

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {receipts.map((receipt) => {
          const currency = receiptCurrency(receipt.provider, chargeCurrency);
          const paidOn = new Date(receipt.paidAt);
          const dateLabel = Number.isNaN(paidOn.getTime())
            ? receipt.paidAt
            : paidOn.toLocaleDateString(locale === 'hi' ? 'hi-IN' : locale === 'ar' ? 'ar' : 'en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

          return (
            <li
              key={receipt.id}
              className="rounded-[12px] border border-line-strong bg-paper px-4 py-3.5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="m-0 text-[15px] font-medium text-ink">
                  {siteText(locale, receiptProductLabel(receipt.product))}
                </p>
                <p className="m-0 font-mono text-[15px] font-medium text-ink">
                  {formatMoney(receipt.amountMinor, currency)}
                </p>
              </div>
              <dl className="m-0 mt-3 grid gap-2 text-[13px] leading-[1.45] text-ink-2 sm:grid-cols-2">
                <div>
                  <dt className="m-0 text-muted">{siteText(locale, 'Receipt number')}</dt>
                  <dd className="m-0 mt-0.5 font-mono text-[14px] text-ink">{receipt.receiptNo || '—'}</dd>
                </div>
                <div>
                  <dt className="m-0 text-muted">{siteText(locale, 'Paid on')}</dt>
                  <dd className="m-0 mt-0.5 text-[14px] text-ink">{dateLabel}</dd>
                </div>
                <div>
                  <dt className="m-0 text-muted">{siteText(locale, 'Payment method')}</dt>
                  <dd className="m-0 mt-0.5 text-[14px] text-ink">
                    {siteText(locale, receiptMethodLabel(receipt.methodHint))}
                  </dd>
                </div>
                <div>
                  <dt className="m-0 text-muted">{siteText(locale, 'Status')}</dt>
                  <dd className="m-0 mt-0.5 text-[14px] font-medium text-ink">
                    {siteText(locale, 'Paid')}
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
