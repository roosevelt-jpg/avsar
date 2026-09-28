import { notFound } from 'next/navigation';
import { DraftNotice } from '@/components/ui/DraftNotice';
import { getDictionary, isLocale } from '@/lib/i18n';
import { COHORT } from '@/lib/data/cohort';

export const metadata = { title: 'Selection rules' };

/**
 * The page every odds disclosure links to, from the landing page, the checkout
 * consent and the FAQ. Its job is to state plainly what a candidate is buying
 * and what they are not, in one place a regulator or a journalist can read.
 */
export default async function SelectionRulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      <h1>{t.selectionRules}</h1>

      <DraftNotice note="Placeholder wording. Needs review under India's Emigration Act and recruiting-agent rules, prize and competition law in each state, Indian consumer law, and Portuguese and EU rules on private employment agencies, before this page is published." />

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
        Avsar to offer work.
      </p>

      <h2>The Portugal placement, and the odds</h2>
      <p>
        Approximately {COHORT.selectedPerCohort} candidate is selected for the supported placement in
        Portugal per cohort of about {COHORT.cohortSize.toLocaleString('en-GB')}. Put plainly: the
        overwhelming majority of candidates will not be selected. Register only if the report and the
        talent-pool profile are worth the fee to you on their own.
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

      <h2>Cohort dates</h2>
      <ul>
        <li>Applications close: {COHORT.closesAt} (placeholder)</li>
        <li>Review period ends: {COHORT.reviewUntil} (placeholder)</li>
        <li>Selection announced: {COHORT.announceAt} (placeholder)</li>
      </ul>

      <h2>Employer contact without selection</h2>
      <p>
        A profile that is visible can be found by vetted employers, who may invite the candidate to
        interview independently of the cohort placement. A candidate can hide their profile at any
        time from their dashboard.
      </p>

      <h2>Registration and licensing</h2>
      <p>
        Registration details for India and Portugal will be listed here. Recruitment for overseas
        employment from India requires a registered recruiting agent; the platform entity, the
        registration number and the partner arrangements will be named on this page before the first
        cohort opens.
      </p>
    </>
  );
}
