import { notFound } from 'next/navigation';
import { DraftNotice } from '@/components/ui/DraftNotice';
import { getDictionary, isLocale } from '@/lib/i18n';
import { activePrice, formatInr } from '@/lib/data/cohort';

export const metadata = { title: 'Refund policy' };

export default async function RefundPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const price = activePrice();

  return (
    <>
      <h1>{t.footerRefund}</h1>

      <DraftNotice note="Placeholder wording. Needs review under Indian consumer law and the GST treatment of a refund on a cross-border digital service, before this page is published." />

      <h2>Before you start the assessment</h2>
      <p>
        Cancel at any point before starting the assessment and the full {formatInr(price.totalPaise)}
        {' '}is refunded, including the GST component, to the original payment method.
      </p>

      <h2>After you start the assessment</h2>
      <p>
        Once the assessment is started the fee is not refundable, because the assessment and the
        report are the service being delivered.
      </p>

      <h2>If we cancel a cohort</h2>
      <p>
        If a cohort is cancelled before assessments begin, every candidate is refunded in full. If it
        is cancelled after, every candidate still receives their report and profile.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Write from the email address on the account. Refunds are processed within 7 working days of
        approval; the time the money takes to arrive depends on the payment method and the bank.
      </p>
    </>
  );
}
