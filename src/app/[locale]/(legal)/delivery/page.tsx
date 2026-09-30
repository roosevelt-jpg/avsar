import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { DELIVERY, RESPONSE_DAYS } from '@/lib/data/brand';

export const metadata = { title: 'Service delivery' };

/**
 * How and when the service reaches the buyer.
 *
 * Merchant onboarding asks every seller for this, and for a physical product it
 * would be a shipping policy. Nothing here is shipped, so the page says what
 * arrives, by what route and in what time, which is also what settles a dispute
 * about whether the service was delivered at all.
 */
export default async function DeliveryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <h1>Service delivery</h1>
      <p>
        Everything sold here is delivered online. Nothing is shipped and there are no delivery
        charges.
      </p>

      <h2>What arrives, and when</h2>
      <ul>
        <li>
          <strong>Access to the assessment: immediately.</strong> As soon as your payment is
          confirmed you can start, or come back within 14 days.
        </li>
        <li>
          <strong>Your skills report: within {DELIVERY.reportWithinDays} days</strong> of completing
          the assessment. It appears in your dashboard and can be downloaded as a PDF.
        </li>
        <li>
          <strong>Your talent-pool profile: within {DELIVERY.reportWithinDays} days</strong>, and it
          stays available to vetted employers for {DELIVERY.profileMonths} months.
        </li>
        <li>
          <strong>A decision on your application: within {RESPONSE_DAYS} days</strong> of your
          application being complete, whether the answer is yes or no.
        </li>
      </ul>

      <h2>How you receive it</h2>
      <p>
        Through your account on this site. We also message you at the email address and mobile
        number you registered when your report is ready.
      </p>

      <h2>If something does not arrive</h2>
      <p>
        Contact us. If we have not delivered the report within{' '}
        {DELIVERY.reportWithinDays} days of you completing the assessment, and the delay is ours, you
        are entitled to a full refund even though you have started.
      </p>
    </>
  );
}
