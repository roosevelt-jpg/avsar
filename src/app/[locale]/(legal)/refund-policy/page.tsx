import { notFound } from 'next/navigation';
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

      <h2>When you pay</h2>
      <p>
        After the assessment, not before. You register, fill in your profile and
        sit the assessment at no cost. The fee is payable when you want the
        skills report, the career pack and the place in the talent pool.
      </p>

      <h2>After you pay</h2>
      <p>
        The report, the rewritten CV and the interview preparation are available
        to download the moment the payment clears, so the service is delivered
        immediately and in full. For that reason the fee is not refundable once
        you have downloaded any of them.
      </p>

      <h2>If you have paid and not downloaded anything</h2>
      <p>
        Write to us within 14 days and the full {formatInr(price.totalPaise)},
        including the GST component, is refunded to the original payment method.
        Nothing has been delivered, so there is nothing to argue about.
      </p>

      <h2>If we cancel a cohort</h2>
      <p>
        If a cohort is cancelled before assessments begin, every candidate is refunded in full. If it
        is cancelled after, every candidate still receives their report and profile.
      </p>

      <h2>If we are late with your report</h2>
      <p>
        If we have not delivered your report within 7 days of you completing the assessment, and the
        delay is ours, you are entitled to a full refund even though you have started.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Write from the email address on the account, or use the contact page. We reply within two
        working days. Approved refunds are issued within 7 working days to the original payment
        method, including the GST component; how long the money then takes to appear depends on your
        bank and the payment method used.
      </p>

      <h2>Chargebacks</h2>
      <p>
        If you believe a charge is wrong, contact us before raising it with your bank. We would
        rather resolve it directly and faster than a chargeback takes.
      </p>
    </>
  );
}
