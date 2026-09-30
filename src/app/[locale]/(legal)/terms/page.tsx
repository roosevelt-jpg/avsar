import { notFound } from 'next/navigation';
import { EntityDetails } from '@/components/ui/EntityDetails';
import { isLocale } from '@/lib/i18n';
import { activePrice, formatInr } from '@/lib/data/cohort';
import { ASSESSMENT_FEE, BRAND, DELIVERY, RESPONSE_DAYS, PLACEMENT_FEE } from '@/lib/data/brand';

export const metadata = { title: 'Terms and conditions' };

/**
 * Terms of service.
 *
 * A payment aggregator's merchant review reads this page looking for what is
 * being sold, for how much, who is selling it and what happens if it goes
 * wrong. Every one of those is stated below in plain words rather than left to
 * be inferred.
 */
export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const price = formatInr(activePrice().totalPaise);

  return (
    <>
      <h1>Terms and conditions</h1>
      <p>
        These terms govern your use of this website and the assessment service sold on it. By
        registering and paying the assessment fee you accept them.
      </p>

      <h2>Who you are contracting with</h2>
      <EntityDetails />

      <h2>What is being sold</h2>
      <p>
        A professional assessment of your work skills, experience and English, delivered online, and
        a written skills report based on it. The fee is {price}, about €{ASSESSMENT_FEE.eur},
        charged once. Indian GST at 18% is included in that amount and is not added at checkout.
      </p>
      <p>
        The fee buys the assessment and the report. It does not buy a job, a visa, a placement in
        Portugal, or any promise of one, and paying it places you ahead of nobody.
      </p>

      <h2>What we undertake to do</h2>
      <ul>
        <li>Deliver the assessment online, at a time you choose.</li>
        <li>
          Deliver your skills report within {DELIVERY.reportWithinDays} days of you completing the
          assessment.
        </li>
        <li>Give you a decision on your application within {RESPONSE_DAYS} days, either way.</li>
        <li>
          Keep your talent-pool profile available to vetted employers for {DELIVERY.profileMonths}{' '}
          months, for as long as you choose to remain visible.
        </li>
      </ul>

      <h2>What you undertake to do</h2>
      <ul>
        <li>Give accurate information about your identity, work history and qualifications.</li>
        <li>Sit the assessment yourself. Having somebody else sit it voids the result and the fee.</li>
        <li>Use one account. Duplicate applications are removed without refund.</li>
      </ul>

      <h2>Fees you will never pay us</h2>
      <p>
        {PLACEMENT_FEE.payer === 'employer'
          ? `The assessment fee is the only amount ${BRAND.name} charges a candidate. Our placement fee is paid by the employer. Nobody is authorised to ask you for money for a job, a visa, or to move your application forward, and any such request should be reported to us.`
          : 'Placement fees payable by a candidate are set out in the selection rules.'}
      </p>

      <h2>Cancellation and refunds</h2>
      <p>
        Set out in full in the refund policy, which forms part of these terms. In short: a full
        refund before you start the assessment, and none after, because at that point the service
        is being delivered.
      </p>

      <h2>Selection</h2>
      <p>
        Selection for a placement in Portugal is not guaranteed and is decided on assessment score,
        interview and document checks. The selection rules page sets out the process and the
        published success rate.
      </p>

      <h2>Your information</h2>
      <p>
        Handled as described in the privacy policy. Scoring is automated; no decision affecting your
        application is taken by an automated system alone.
      </p>

      <h2>Liability</h2>
      <p>
        We are responsible for delivering the assessment and the report as described. We are not
        responsible for an employer&rsquo;s hiring decision, for a visa decision taken by any
        government, or for losses arising from information you gave us that was not accurate.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the law of the jurisdiction in which the contracting entity is
        registered, without affecting any right you have under the consumer law of your own country.
      </p>

      <h2>Changes</h2>
      <p>
        We may change these terms. The terms that apply to you are the ones published when you paid,
        and we keep previous versions.
      </p>
    </>
  );
}
