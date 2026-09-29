import { notFound } from 'next/navigation';
import { DraftNotice } from '@/components/ui/DraftNotice';
import { getDictionary, isLocale } from '@/lib/i18n';

export const metadata = { title: 'Privacy' };

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      <h1>{t.footerPrivacy}</h1>

      <DraftNotice note="Placeholder wording. Needs review under India's DPDP Act 2023, the GDPR for the Portuguese side, and the transfer basis out of the UAE entity, before this page is published." />

      <h2>What is collected</h2>
      <ul>
        <li>Identity and contact details: name, mobile, email, city and state.</li>
        <li>Profile: sector, years of experience, self-rated English, passport status.</li>
        <li>Assessment answers, scores and the resulting report.</li>
        <li>Payment records. Card details are never seen or stored by S&A Recruitment.</li>
      </ul>

      <h2>Who can see a profile</h2>
      <p>
        Vetted employers can search the talent pool and see name, city, sector, English level, score
        and years of experience. Contact details are released only when a candidate accepts an
        interview invitation. A candidate can hide their profile at any time.
      </p>

      <h2>Where data is held</h2>
      <p>
        Candidate data for the Indian corridor is held in an Indian region. Data moves to the
        European region only when a candidate is being placed, and only with their explicit consent,
        under standard contractual clauses. The two systems are kept separate by design.
      </p>

      <h2>Automated decisions</h2>
      <p>
        Scoring is computed automatically. No selection, rejection or shortlisting decision is made
        by an automated system alone: a person reviews every decision that affects a candidate, and a
        candidate can ask for the reasoning behind any decision and contest it.
      </p>

      <h2>Retention</h2>
      <p>
        Profiles stay in the talent pool for 12 months from the assessment, then are archived unless
        the candidate renews. Assessment records are kept for as long as needed to answer a challenge
        to a selection decision.
      </p>

      <h2>Your rights</h2>
      <p>
        Access, correction, deletion, and withdrawal of consent, in each case through the contact
        address on this site.
      </p>
    </>
  );
}
