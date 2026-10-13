import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/lib/i18n';
import { SELECTION_FUNNEL, applicantHireRate } from '@/lib/data/brand';

export const metadata = { title: 'Selection rules' };

/**
 * The page every odds disclosure links to, from the landing page, the checkout
 * consent and the FAQ. Its job is to state plainly what a candidate is buying
 * and what they are not, in one place a regulator or a journalist can read.
 *
 * Reviewed and published as final on 6 October 2026. It carried a draft notice
 * until then, which mattered because the consent checkbox links here: asking
 * somebody to confirm they have read a document that calls itself unreviewed
 * weakens the one record that proves the terms were shown.
 *
 * `CONSENT_VERSION` moves whenever the wording here or in the terms changes, so
 * what each candidate agreed to stays recoverable.
 */
export default async function SelectionRulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      <h1>{t.selectionRules}</h1>

      <h2>What the fee buys</h2>
      <p>
        The assessment fee pays for three things, and every candidate who completes the assessment
        receives all three: a full assessment of skills, work experience and English; a personal
        skills report; and a verified profile in the talent pool for 12 months.
      </p>

      <h2>What the fee does not buy</h2>
      <p>
        The fee does not buy a job, a visa, a placement in Portugal, or any promise of one. It does
        not place a candidate ahead of anyone else. Paying it does not create any obligation on
        S&A Recruitment to offer work.
      </p>

      <h2>The odds, stated precisely</h2>
      <p>
        We publish a figure of {SELECTION_FUNNEL.presentedToHirePercent}%. It is a
        submission-to-hire rate: the share of candidates we <strong>present to an
        employer</strong> who receive an offer. It is the standard measure used in
        recruitment and it is not the share of applicants who are hired.
      </p>
      <p>Out of every 100 people who complete the assessment:</p>
      <ul>
        <li>{SELECTION_FUNNEL.perHundredApplicants.reachAssessmentCall} reach an assessment call</li>
        <li>{SELECTION_FUNNEL.perHundredApplicants.presentedToEmployer} are presented to an employer</li>
        <li>{SELECTION_FUNNEL.perHundredApplicants.hired} are hired</li>
      </ul>
      <p>
        So roughly {applicantHireRate()} in every 100 applicants are placed. Most people who
        apply are not. Register only if the assessment and the report are worth the fee
        to you on their own.
      </p>

      <h2>How selection is decided</h2>
      <ul>
        <li>Ranking by overall assessment score, highest first.</li>
        <li>Interview with the highest-ranked candidates.</li>
        <li>Document and right-to-work checks.</li>
        <li>Offer to the highest-ranked candidate who passes both.</li>
      </ul>
      <p>
        Selection is on merit, not chance. Scores, interview notes and the reason for the final
        decision are retained and can be requested by any candidate in the cohort.
      </p>

      <h2>Where these figures come from</h2>
      <p>{SELECTION_FUNNEL.basis}</p>

      <h2>Employer contact without selection</h2>
      <p>
        A profile that is visible can be found by vetted employers, who may invite the candidate to
        interview independently of the cohort placement. A candidate can hide their profile at any
        time from their dashboard.
      </p>
    </>
  );
}
