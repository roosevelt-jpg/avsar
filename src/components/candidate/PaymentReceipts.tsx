'use client';

import { useEffect, useRef, useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { formatMoney, type ChargeCurrency, type CompanySettings } from '@/lib/company/config';
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
 * Each row opens a full receipt in a native dialog (click, or auto-open after
 * checkout return). The email remains the formal copy.
 */
export function PaymentReceipts({
  locale,
  receipts,
  chargeCurrency,
  company,
  candidateName,
  highlight,
}: {
  locale: Locale;
  receipts: CandidateReceipt[];
  chargeCurrency: ChargeCurrency;
  company: CompanySettings;
  candidateName: string;
  /** After return from checkout, open the newest receipt. */
  highlight?: boolean;
}) {
  /* After checkout return, start with the newest receipt already selected so
     the dialog opens without a second render from an effect. */
  const [openId, setOpenId] = useState<string | null>(() =>
    highlight && receipts[0] ? receipts[0].id : null,
  );
  const dialog = useRef<HTMLDialogElement>(null);

  const active = openId ? receipts.find((row) => row.id === openId) ?? null : null;

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (openId && !node.open) node.showModal();
    if (!openId && node.open) node.close();
  }, [openId]);

  if (receipts.length === 0) return null;

  const dateLocale = locale === 'hi' ? 'hi-IN' : locale === 'ar' ? 'ar' : 'en-GB';

  function close() {
    setOpenId(null);
  }

  return (
    <>
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
            'Tap a receipt to open it. A copy was also sent to your email. Keep the receipt number if you write to us about this payment.',
          )}
        </p>

        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {receipts.map((receipt) => {
            const currency = receiptCurrency(receipt.currency, chargeCurrency);
            const paidOn = new Date(receipt.paidAt);
            const dateLabel = Number.isNaN(paidOn.getTime())
              ? receipt.paidAt
              : paidOn.toLocaleDateString(dateLocale, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

            return (
              <li key={receipt.id}>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => setOpenId(receipt.id)}
                  className="t-colors w-full cursor-pointer rounded-[12px] border border-line-strong bg-paper px-4 py-3.5 text-left hover:border-ink"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="m-0 text-[15px] font-medium text-ink">
                      {siteText(locale, receiptProductLabel(receipt.product))}
                    </p>
                    <p className="m-0 font-mono text-[15px] font-medium text-ink">
                      {formatMoney(receipt.amountMinor, currency)}
                    </p>
                  </div>
                  <p className="m-0 mt-2 text-[13px] text-ink-2">
                    <span className="font-mono text-ink">{receipt.receiptNo || '—'}</span>
                    <span className="mx-2 text-muted">·</span>
                    {dateLabel}
                    <span className="mx-2 text-muted">·</span>
                    {siteText(locale, receiptMethodLabel(receipt.methodHint))}
                  </p>
                  <p className="m-0 mt-2 text-[13px] font-medium text-accent-deep">
                    {siteText(locale, 'Open receipt')}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <dialog
        ref={dialog}
        onClose={close}
        onMouseDown={(event) => {
          if (event.target === dialog.current) close();
        }}
        className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[16px] border border-line bg-paper p-0 text-ink backdrop:bg-ink/55 backdrop:backdrop-blur-[2px]"
      >
        {active ? (
          <ReceiptDocument
            locale={locale}
            receipt={active}
            chargeCurrency={chargeCurrency}
            company={company}
            candidateName={candidateName}
            dateLocale={dateLocale}
            onClose={close}
          />
        ) : null}
      </dialog>
    </>
  );
}

function ReceiptDocument({
  locale,
  receipt,
  chargeCurrency,
  company,
  candidateName,
  dateLocale,
  onClose,
}: {
  locale: Locale;
  receipt: CandidateReceipt;
  chargeCurrency: ChargeCurrency;
  company: CompanySettings;
  candidateName: string;
  dateLocale: string;
  onClose: () => void;
}) {
  const currency = receiptCurrency(receipt.currency, chargeCurrency);
  const paidOn = new Date(receipt.paidAt);
  const dateLabel = Number.isNaN(paidOn.getTime())
    ? receipt.paidAt
    : paidOn.toLocaleDateString(dateLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
  const seller = company.tradingAs || company.legalName;
  const amount = formatMoney(receipt.amountMinor, currency);

  return (
    <div className="p-[clamp(20px,4cqi,28px)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Mono className="text-accent-deep">{siteText(locale, 'Receipt')}</Mono>
          <h2 className="m-0 mt-1.5 text-[22px] font-semibold leading-[1.2] tracking-[-0.02em]">
            {seller}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="t-colors cursor-pointer rounded-[8px] border border-line-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-ink hover:border-ink"
        >
          {siteText(locale, 'Close')}
        </button>
      </div>

      <p className="m-0 mt-2 text-[13px] leading-[1.5] text-ink-2">
        {company.legalName}
        {company.registeredAddress ? (
          <>
            <br />
            {company.registeredAddress}
          </>
        ) : null}
      </p>

      <p className="m-0 mt-5 font-mono text-[18px] font-semibold text-ink">{amount}</p>
      <p className="m-0 mt-1 text-[15px] font-medium text-ink">
        {siteText(locale, receiptProductLabel(receipt.product))}
      </p>

      <dl className="m-0 mt-5 grid gap-3 border-t border-line pt-4 text-[14px] leading-[1.45]">
        <div className="flex justify-between gap-3">
          <dt className="m-0 text-muted">{siteText(locale, 'Receipt number')}</dt>
          <dd className="m-0 font-mono text-ink">{receipt.receiptNo || '—'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="m-0 text-muted">{siteText(locale, 'Paid on')}</dt>
          <dd className="m-0 text-ink">{dateLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="m-0 text-muted">{siteText(locale, 'Payment method')}</dt>
          <dd className="m-0 text-ink">{siteText(locale, receiptMethodLabel(receipt.methodHint))}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="m-0 text-muted">{siteText(locale, 'Paid by')}</dt>
          <dd className="m-0 text-ink">{candidateName || '—'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="m-0 text-muted">{siteText(locale, 'Status')}</dt>
          <dd className="m-0 font-medium text-ink">{siteText(locale, 'Paid')}</dd>
        </div>
      </dl>

      <p className="m-0 mt-5 text-[12px] leading-[1.5] text-muted">
        {siteText(
          locale,
          'This is not a job offer and not a visa decision. Keep this receipt number if you write to us about this payment.',
        )}
      </p>
    </div>
  );
}
