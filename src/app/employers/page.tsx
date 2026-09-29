import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import { Wordmark } from '@/components/ui/Wordmark';
import { EmployerSearchBox } from '@/components/employer/EmployerSearchBox';
import { SAMPLE_TALENT, initials } from '@/lib/data/candidates';
import { EMPLOYER_PRICE_EUR } from '@/lib/data/cohort';
import { AccountMenu } from '@/components/auth/AccountMenu';

export const metadata = {
  title: 'Hire pre-assessed workers from India',
  description:
    'Search a pool of candidates scored on skills, experience and English. Visas, relocation, housing and onboarding handled.',
};

const STEPS = [
  ['Search and shortlist', 'Describe the role in plain words. Filter by sector, English level and experience.'],
  ['Interview', 'Video interviews with shortlisted candidates, with their full skills report attached.'],
  ['We relocate them', 'Work visa, travel, housing and arrival support, handled by our team in Portugal.'],
] as const;

export default async function EmployerLanding() {
  /* Three hospitality rows with English at B1 or better, as in the prototype. */
  const sample = SAMPLE_TALENT.filter((row) => row.sector === 'hospitality').slice(0, 3);

  return (
    <div className="avsar-root">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href="/employers" suffix="for employers" accent="employer" />
        <nav className="flex flex-wrap gap-[clamp(12px,2.4cqi,28px)] text-[15px] text-ink-2">
          <Link href="/admin" className="no-underline hover:text-employer t-colors">
            Talent pool
          </Link>
          <Link href="/employers#how" className="no-underline hover:text-employer t-colors">
            How it works
          </Link>
          <Link href="/en/pricing" className="no-underline hover:text-employer t-colors">
            Pricing
          </Link>
          <Link href="/en" className="no-underline hover:text-employer t-colors">
            For candidates
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <AccountMenu locale="en" tone="employer" />
          <Link
            href="/employers#contact"
            className="t-colors rounded-[10px] bg-employer px-4 py-2.5 text-[14px] font-medium text-white no-underline hover:bg-employer-deep"
          >
            Book a call
          </Link>
        </div>
      </header>

      <section className="flex flex-col items-start gap-6 px-[clamp(20px,4cqi,56px)] pt-[clamp(48px,9cqi,110px)] pb-[clamp(40px,6cqi,72px)]">
        <h1 className="m-0 max-w-[22ch] text-balance text-[clamp(36px,6cqi,72px)] font-semibold leading-[1.04] tracking-[-0.035em]">
          Hire pre-assessed workers from India for your team in Portugal.
        </h1>
        <p className="m-0 max-w-[60ch] text-[clamp(16px,1.8cqi,19px)] leading-[1.55] text-ink-2">
          Search a pool of candidates scored on skills, experience and English. We handle visas,
          relocation, housing and onboarding.
        </p>
        <EmployerSearchBox />
      </section>

      <section className="px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,7cqi,88px)]">
        <div className="max-w-[720px] rounded-[20px] border border-line bg-surface p-[clamp(18px,2.4cqi,26px)]">
          <Mono className="text-muted">Sample results · Hospitality · English ≥ B1</Mono>
          <ul className="m-0 mt-4 list-none divide-y divide-line-soft p-0">
            {sample.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-4 py-3.5">
                <span
                  aria-hidden
                  className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-surface-subtle font-mono text-[12px] text-ink-2"
                >
                  {initials(row.name)}
                </span>
                <span className="min-w-[140px] flex-1">
                  <span className="block text-[15px] font-medium">{row.name}</span>
                  <span className="block text-[13px] text-muted">{row.city}</span>
                </span>
                <Mono className="text-muted">{row.yearsExperience}y</Mono>
                <Mono className="text-muted">English {row.english}</Mono>
                <Mono className="font-medium text-employer-deep">Score {row.score}</Mono>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="bg-ink px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,104px)] text-paper">
        <h2 className="m-0 mb-10 max-w-[20ch] text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          From search to first shift
        </h2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-7 p-0">
          {STEPS.map(([title, body], index) => (
            <li key={title} className="border-t border-dark-line pt-5">
              <Mono className="text-dark-muted">{String(index + 1).padStart(2, '0')}</Mono>
              <h3 className="mt-3 mb-2 text-[19px] font-semibold leading-[1.3]">{title}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-dark-muted-2">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="contact" className="px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,104px)]">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[28px] bg-employer px-[clamp(24px,4cqi,56px)] py-[clamp(32px,5cqi,56px)]">
          <div>
            <h2 className="m-0 max-w-[24ch] text-[clamp(24px,3.2cqi,40px)] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
              Tell us what roles you need to fill.
            </h2>
            <p className="m-0 mt-3 text-[15px] text-white/80">
              €{EMPLOYER_PRICE_EUR.toLocaleString('en-GB')} per placement. Search is free.
            </p>
          </div>
          <Link
            href="mailto:employers@smithandadams.com"
            className="t-colors shrink-0 rounded-[12px] bg-white px-5 py-3 text-[15px] font-medium text-ink no-underline hover:bg-paper"
          >
            Book a call →
          </Link>
        </div>
      </section>

      <footer className="bg-ink px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,64px)] text-dark-muted-2">
        <Wordmark tone="dark" accent="employer" />
        <p className="mt-8 border-t border-dark-line pt-6 font-mono text-[12px] text-dark-muted">
          © 2026 S&A Recruitment, a Smith & Adams company · Lisbon · New Delhi
        </p>
      </footer>
    </div>
  );
}
