import { notFound } from 'next/navigation';
import { EntityDetails } from '@/components/ui/EntityDetails';
import { isLocale } from '@/lib/i18n';
import { activePrice, formatPrice } from '@/lib/data/cohort';
import {
  BRAND,
  ENTITY,
  DELIVERY,
  RESPONSE_DAYS,
  PLACEMENT_FEE,
  PLACEMENT_FEE_UNDISCLOSED,
} from '@/lib/data/brand';

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
  const price = formatPrice(activePrice().totalMinor);

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
        A professional assessment of your work skills, experience and English, delivered online, a
        written skills report based on it, and a career pack: a rewritten CV built from your own
        experience, interview preparation, and a development plan. All of it is yours to keep and
        use with any employer. The fee is {price}, charged once, and nothing is added at
        checkout. The seller is {ENTITY.legalName}, the company behind the Smith &amp; Adams
        brand, registered in Portugal. Your bank statement will show{' '}
        {ENTITY.statementDescriptor} rather than the name you signed up under.
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
        <li>
          Deliver your career pack on request once your report is ready. It is built only from
          information you have given us; nothing is added that you cannot support.
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

      {/*
        Three states, and the middle one is the uncomfortable one.

        When the employer pays, the terms can say so plainly. When the
        candidate pays and has been told, the amount and its condition belong
        here in full. While the placement fee is withheld, this section says
        what is true about the assessment fee and stops: it must not claim the
        assessment fee is the only amount charged, which would be false, and it
        must not name a figure the rest of the site is not showing.

        That middle state is why the checkout refuses. See `PLACEMENT_FEE`.
      */}
      <h2>{PLACEMENT_FEE.payer === 'employer' ? 'Fees you will never pay us' : 'Fees'}</h2>
      <p>
        {PLACEMENT_FEE.payer === 'employer'
          ? `The assessment fee is the only amount ${BRAND.name} charges a candidate. Our placement fee is paid by the employer. Nobody is authorised to ask you for money for a job, a visa, or to move your application forward, and any such request should be reported to us.`
          : PLACEMENT_FEE_UNDISCLOSED
            ? `The assessment fee buys the assessment, the report and the career pack, and is payable whatever the outcome. Nobody is authorised to ask you for money for a job, a visa, or to move your application forward, and any such request should be reported to us.`
            : `There are two amounts, and only the first is payable now. The assessment fee buys the assessment, the report and the career pack, and is payable whatever the outcome. The placement fee of €${PLACEMENT_FEE.eur.toLocaleString('en-GB')} is payable only if you are placed, and only after your employment contract is signed: never in advance, never as a condition of being considered, and never as a condition of an interview. Outside these two amounts nobody is authorised to ask you for money for a job, a visa, or to move your application forward, and any such request should be reported to us.`}
      </p>

      <h2>When the fee is due</h2>
      <p>
        After the assessment, not before. Registering, completing your profile and sitting the
        assessment cost nothing. The fee is payable when you want the skills report, the career
        pack and your place in the talent pool, and nothing is charged until you ask for them.
      </p>

      <h2>Cancellation and refunds</h2>
      <p>
        Set out in full in the refund policy, which forms part of these terms. In short: a full
        refund within 14 days if you have paid and downloaded nothing, and none after you have
        downloaded the report, the CV or the interview preparation, because at that point the
        service has been delivered in full.
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
