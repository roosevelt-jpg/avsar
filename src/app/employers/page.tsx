import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import { Wordmark } from '@/components/ui/Wordmark';
import { EmployerSearchBox } from '@/components/employer/EmployerSearchBox';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { ContactForm } from '@/components/contact/ContactForm';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getSiteSettings } from '@/lib/cms/data';
import { formatMoney } from '@/lib/company/config';
import { assessedCount } from '@/lib/company/data';
import { staticPageMetadata } from '@/lib/seo';

/* Settings saves revalidate this page; the assessed count has no save to hang
   off, so it is refreshed hourly instead of frozen at build time. */
export const revalidate = 3600;

export async function generateMetadata() {
  return staticPageMetadata('employers', 'en');
}

const STEPS = [
  ['Search and shortlist', 'Describe the role in plain words. Filter by sector, English level and experience.'],
  ['Interview', 'Video interviews with shortlisted candidates, with their full skills report attached.'],
  ['We relocate them', 'Work visa, travel, housing and arrival support, handled by our team in Lisbon.'],
] as const;

export default async function EmployerLanding() {
  const [settings, assessed] = await Promise.all([getSiteSettings(), assessedCount()]);
  const { company, pricing } = settings;
  return (
    <div className="avsar-root">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href="/employers" suffix="for employers" accent="employer" />
        <nav className="flex flex-wrap gap-[clamp(12px,2.4cqi,28px)] text-[15px] text-ink-2">
          <Link href="/admin/employer" className="no-underline hover:text-employer t-colors">
            Talent pool
          </Link>
          <Link href="/employers#how" className="no-underline hover:text-employer t-colors">
            How it works
          </Link>
          <Link href="/pricing" className="no-underline hover:text-employer t-colors">
            Pricing
          </Link>
          <Link href="/" className="no-underline hover:text-employer t-colors">
            For candidates
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <AccountMenu locale="en" tone="employer" />
          <Link
            href="/employers#contact"
            className="t-colors rounded-[10px] bg-ink px-4 py-2.5 text-[14px] font-medium text-paper no-underline hover:bg-ink-hover"
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
        {assessed > 0 ? (
          <Mono className="text-muted">{assessed.toLocaleString('en-GB')} candidates assessed so far</Mono>
        ) : null}
        <EmployerSearchBox />
      </section>

      <section id="how" className="bg-night px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,104px)] text-on-night">
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
        {/* The same light grey panel as the call-to-action bands on the
            candidate pages, so the two sides of the site look like one. */}
        <div className="grid gap-8 rounded-[28px] border border-line bg-tint-sand px-[clamp(24px,4cqi,56px)] py-[clamp(32px,5cqi,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)]">
          <div>
            <h2 className="m-0 max-w-[24ch] text-[clamp(24px,3.2cqi,40px)] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
              Tell us what roles you need to fill.
            </h2>
            <p className="m-0 mt-3 text-[15px] text-ink-2">
              {formatMoney(pricing.employerPlacementFeeMinor, 'EUR')} per placement. Search is free.
            </p>
            {company.employerEmail ? (
              <p className="m-0 mt-3 text-[15px] text-ink-2">
                Or write to <span className="font-mono">{company.employerEmail}</span>.
              </p>
            ) : null}
          </div>
          <div className="rounded-[20px] border border-line bg-surface px-5 pt-1 pb-6 sm:px-7">
            <ContactForm variant="employer" />
          </div>
        </div>
      </section>

      <SiteFooter locale="en" />
    </div>
  );
}
