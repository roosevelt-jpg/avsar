import Image from 'next/image';
import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { ContactForm } from '@/components/contact/ContactForm';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import { LocaleToggle } from '@/components/candidate/LocaleToggle';
import { EmployerHero } from '@/components/employer/EmployerHero';
import { Icon } from '@/components/cms/primitives';
import { getSiteSettings } from '@/lib/cms/data';
import { formatMoney } from '@/lib/company/config';
import { localHref } from '@/lib/cms/settings';
import { staticPageMetadata } from '@/lib/seo';

/* Settings saves revalidate this page. */
export const revalidate = 3600;

export async function generateMetadata() {
  return staticPageMetadata('employers', 'en');
}

/**
 * Employer landing — Portugal Talent Recruitment mockup shell.
 *
 * Copy, photographs, CTAs and the stats ribbon come from Settings › Employer
 * landing. Contact form still posts through the existing intake wiring.
 */
export default async function EmployersPage() {
  const settings = await getSiteSettings();
  const page = settings.employerLanding;
  const { company, pricing } = settings;
  const fee = formatMoney(pricing.employerPlacementFeeMinor, 'EUR');

  /* Empty or mockup leftovers (1,200+ / 98% / 150+) never render. */
  const fakeStat = /^(?:\d[\d,]*)\+?%?$|98%|30[–-]45/i;
  const stats = [
    { value: page.statsCandidatesValue, label: page.statsCandidates, icon: 'users' as const },
    { value: page.statsIndustriesValue, label: page.statsIndustries, icon: 'building' as const },
    { value: page.statsPlacedValue, label: page.statsPlaced, icon: 'shield' as const },
    { value: page.hiringTimeValue, label: page.hiringTimeLabel, icon: 'clock' as const },
  ].filter((item) => {
    const value = item.value.trim();
    if (!value) return false;
    if (/1,?200|150\+|60\+|98%|20\+/i.test(value)) return false;
    if (fakeStat.test(value) && /\+|%/.test(value)) return false;
    return true;
  });

  const navItems = page.headerLinks.map((item) => ({
    href: localHref('en', item.href),
    label: item.label,
  }));

  return (
    <div className="avsar-root market bg-[#f4f5f7] text-ink">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#142438] text-white">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-[clamp(16px,4cqi,56px)] py-[14px]">
          <Wordmark href="/employers" tone="dark" size={20} />

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-[clamp(12px,1.2vw,22px)] text-[14px] font-medium lg:flex">
            {navItems.map((item) => {
              const active = item.href === '/employers' || item.href.endsWith('/employers');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`t-colors whitespace-nowrap no-underline hover:text-[var(--color-gold)] ${
                    active ? 'border-b border-[var(--color-gold)] pb-0.5 text-[var(--color-gold)]' : 'text-white/85'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LocaleToggle locale="en" />
            <AccountMenu locale="en" tone="employer" />
            <Link
              href={page.ctaHref || '/employers/register'}
              className="t-colors hidden items-center gap-1.5 rounded-[8px] bg-[#b28a49] px-4 py-2 text-[13px] font-semibold text-[#142438] no-underline hover:bg-[#c49a58] lg:inline-flex"
            >
              {page.headerCtaLabel || page.ctaLabel}
              <span aria-hidden>→</span>
            </Link>

            <details className="group relative lg:hidden">
              <summary
                aria-label="Menu"
                className="grid size-10 cursor-pointer list-none place-items-center rounded-[8px] border border-white/25 text-white [&::-webkit-details-marker]:hidden"
              >
                <svg viewBox="0 0 24 24" className="size-5 group-open:hidden" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
                <svg viewBox="0 0 24 24" className="hidden size-5 group-open:block" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </summary>
              <div className="absolute end-0 top-12 w-[min(86vw,320px)] rounded-[12px] border border-white/15 bg-[#142438] p-3 shadow-[0_24px_60px_-24px_rgba(8,20,36,0.7)]">
                <nav aria-label="Mobile" className="flex flex-col">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} className="rounded-[10px] px-3 py-3 text-[15px] text-white no-underline hover:bg-white/10">
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <Link
                  href={page.ctaHref || '/employers/register'}
                  className="mt-3 flex justify-center rounded-[8px] bg-[#b28a49] px-4 py-3 text-[14px] font-semibold text-[#142438] no-underline"
                >
                  {page.headerCtaLabel || page.ctaLabel}
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main>
        <EmployerHero
          eyebrow={page.eyebrow}
          headline={page.headline}
          accentWord={page.accentWord}
          intro={page.intro}
          primaryLabel={page.ctaLabel}
          primaryHref={page.ctaHref || '/employers/register'}
          secondaryLabel={page.secondaryCtaLabel}
          secondaryHref={page.secondaryCtaHref || '#contact'}
          badgeLabel={page.badgeLabel}
          badgeSubtext={page.badgeSubtext}
          badgeHref={page.badgeHref || '/employers/register'}
          slides={page.slides}
        />

        {stats.length > 0 ? (
          <section className="border-y border-[#e2e5ea] bg-[#eef0f3] px-[clamp(20px,4cqi,56px)] py-9 sm:py-11">
            <ul
              className={`mx-auto m-0 grid max-w-[1200px] list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 ${
                stats.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
              }`}
            >
              {stats.map((stat, index) => (
                <li
                  key={stat.label}
                  className={`flex items-start gap-3 px-0 py-4 sm:px-6 sm:py-0 ${
                    index > 0 ? 'lg:border-s lg:border-[#d5d9e0]' : ''
                  }`}
                >
                  <span className="mt-0.5 grid size-10 shrink-0 place-items-center text-[var(--color-gold)]">
                    <Icon name={stat.icon} className="size-6" />
                  </span>
                  <div>
                    <p className="m-0 text-[clamp(26px,3cqi,34px)] font-semibold leading-none tracking-[-0.03em] text-[#142438]">
                      {stat.value}
                    </p>
                    <p className="m-0 mt-1.5 text-[13px] font-medium leading-[1.35] text-ink-2">{stat.label}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="why" className="bg-[#f4f5f7] px-[clamp(20px,4cqi,56px)] py-[clamp(48px,7cqi,88px)]">
          <div className="mx-auto w-full max-w-[1200px]">
            <h2 className="display-serif m-0 text-[clamp(28px,3.6cqi,42px)] font-normal leading-[1.15] text-[#142438]">
              {page.reasonsTitle}
            </h2>
            <span aria-hidden className="mt-3 block h-1 w-14 rounded-full bg-[var(--color-gold)]" />

            <ul className="m-0 mt-10 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {page.reasons.map((reason) => (
                <li key={reason.title} className="min-w-0">
                  <span className="grid size-11 place-items-center rounded-full border border-[var(--color-gold)]/40 text-[var(--color-gold)]">
                    <Icon name={reason.icon} className="size-5" />
                  </span>
                  <h3 className="m-0 mt-4 text-[17px] font-semibold text-[#142438]">{reason.title}</h3>
                  <p className="m-0 mt-2 text-[14px] leading-[1.5] text-ink-2">{reason.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="industries" className="bg-[#f4f5f7] px-[clamp(20px,4cqi,56px)] pb-[clamp(40px,6cqi,72px)]">
          <div className="mx-auto w-full max-w-[1200px] overflow-hidden rounded-[20px] bg-[#142438] text-white">
            <div className="grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="relative min-h-[240px] lg:min-h-[340px]">
                <Image
                  src={page.industriesImage}
                  alt={page.industriesImageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center px-[clamp(22px,4cqi,48px)] py-[clamp(28px,4cqi,44px)]">
                <h2 className="display-serif m-0 text-[clamp(26px,3.2cqi,40px)] font-normal leading-[1.15] text-white">
                  {page.industriesTitle}
                </h2>
                <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-x-6 gap-y-5 p-0 sm:grid-cols-2">
                  {page.industries.map((industry) => (
                    <li key={industry.label} className="flex items-center gap-3 text-[15px] font-medium text-white/95">
                      <span className="grid size-10 shrink-0 place-items-center text-[var(--color-gold)]">
                        <Icon name={industry.icon} className="size-5" />
                      </span>
                      {industry.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f4f5f7] px-[clamp(20px,4cqi,56px)] pb-[clamp(40px,6cqi,72px)]">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 rounded-[20px] border border-[#e2e5ea] bg-[#eef0f3] px-[clamp(22px,4cqi,48px)] py-[clamp(28px,4cqi,44px)] lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-[36rem]">
              <h2 className="display-serif m-0 text-[clamp(26px,3.2cqi,40px)] font-normal leading-[1.15] text-[#142438]">
                {page.closingTitle}
              </h2>
              <p className="m-0 mt-3 text-[15px] leading-[1.55] text-ink-2">{page.closingBody}</p>
            </div>
            <div className="hidden h-16 w-px shrink-0 bg-[var(--color-gold)]/55 lg:block" aria-hidden />
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={page.ctaHref || '/employers/register'}
                className="t-colors inline-flex items-center gap-2 rounded-[10px] bg-[#b28a49] px-5 py-3 text-[14px] font-semibold text-[#142438] no-underline hover:bg-[#c49a58]"
              >
                {page.ctaLabel}
                <span aria-hidden>→</span>
              </Link>
              <Link
                href={page.secondaryCtaHref || '#contact'}
                className="t-colors inline-flex items-center gap-2 rounded-[10px] border border-[#142438]/25 bg-white px-5 py-3 text-[14px] font-semibold text-[#142438] no-underline hover:border-[#142438]"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
                </svg>
                {page.secondaryCtaLabel}
              </Link>
            </div>
          </div>
        </section>

        {/* Existing contact wiring — kept below the mockup shell CTA. */}
        <section id="contact" className="bg-white px-[clamp(20px,4cqi,56px)] pb-[clamp(56px,8cqi,96px)] pt-4">
          <div className="mx-auto grid w-full max-w-[1200px] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
            <div>
              <h2 className="display-serif m-0 text-[clamp(24px,3cqi,36px)] font-normal text-[#142438]">{page.contactTitle}</h2>
              <p className="m-0 mt-3 text-[15px] text-ink-2">{page.contactNote.replaceAll('{{fee}}', fee)}</p>
              {company.employerEmail ? (
                <p className="m-0 mt-3 text-[15px] text-ink-2">
                  Or write to <span className="font-mono">{company.employerEmail}</span>.
                </p>
              ) : null}
            </div>
            <div className="rounded-[16px] border border-line bg-[#f4f5f7] px-5 pt-1 pb-6 sm:px-7">
              <ContactForm variant="employer" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale="en" />
    </div>
  );
}
