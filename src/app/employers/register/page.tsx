import Image from 'next/image';
import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { LocaleToggle } from '@/components/candidate/LocaleToggle';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import { Icon } from '@/components/cms/primitives';
import { EmployerRegisterHero } from '@/components/employer/EmployerRegisterHero';
import { EmployerRegistrationWizard } from '@/components/employer/EmployerRegistrationWizard';
import { getSiteSettings } from '@/lib/cms/data';
import { localHref } from '@/lib/cms/settings';
import { staticPageMetadata } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata() {
  return staticPageMetadata('employerRegister', 'en');
}

/**
 * Employer registration — mockup multi-step enquiry.
 *
 * Copy and photographs come from Settings › Employer registration. Submissions
 * land in the staff inbox via /api/employer/intake. Quote card uses Settings
 * copy (mockup shell defaults); empty quote hides the card.
 */
export default async function EmployerRegisterPage() {
  const settings = await getSiteSettings();
  const page = settings.employerRegistration;
  const navItems = page.headerLinks.map((item) => ({
    href: localHref('en', item.href),
    label: item.label,
  }));
  const showQuote = Boolean(page.quote.trim() && page.quoteAttribution.trim());

  return (
    <div className="avsar-root market bg-[#f5f6f8] text-ink">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#142438] text-white">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-[clamp(16px,4cqi,56px)] py-[14px]">
          <Wordmark href="/employers" tone="dark" size={20} />
          <nav className="hidden min-w-0 items-center gap-[clamp(12px,1.2vw,22px)] text-[14px] font-medium xl:flex">
            {navItems.map((item) => {
              const active = item.href.includes('/employers');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`t-colors whitespace-nowrap no-underline hover:text-[var(--color-gold)] ${
                    active ? 'border-b border-[var(--color-gold)] pb-0.5 text-white' : 'text-white/85'
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
              href={page.headerCtaHref || '/employers/register'}
              className="t-colors hidden items-center gap-1.5 rounded-[8px] bg-[#b28a49] px-4 py-2 text-[13px] font-semibold text-[#142438] no-underline hover:bg-[#c49a58] md:inline-flex"
            >
              {page.headerCtaLabel}
              <span aria-hidden>→</span>
            </Link>
            <details className="group relative xl:hidden">
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
              </div>
            </details>
          </div>
        </div>
      </header>

      <main>
        <EmployerRegisterHero
          eyebrow={page.eyebrow}
          headline={page.headline}
          intro={page.intro}
          slides={page.slides}
          highlights={page.highlights}
        />

        <section className="px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,72px)]">
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12">
            <div>
              <h2 className="display-serif m-0 text-[clamp(26px,3.2cqi,38px)] font-normal text-[#142438]">{page.howTitle}</h2>
              <ol className="relative m-0 mt-8 list-none p-0">
                {page.howSteps.map((item, index) => (
                  <li key={item.title} className="relative flex gap-4 pb-8 last:pb-0">
                    {index < page.howSteps.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute start-[15px] top-9 bottom-0 w-px border-s border-dashed border-[var(--color-gold)]/70"
                      />
                    ) : null}
                    <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-gold)] text-[13px] font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="m-0 flex items-center gap-2 text-[16px] font-semibold text-[#142438]">
                        <Icon name={item.icon} className="size-4 text-[var(--color-gold)]" />
                        {item.title}
                      </h3>
                      <p className="m-0 mt-1 text-[14px] leading-[1.5] text-ink-2">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {showQuote ? (
                <figure className="relative mt-8 overflow-hidden rounded-[16px]">
                  {page.quoteImage ? (
                    <div className="relative aspect-[16/11]">
                      <Image src={page.quoteImage} alt={page.quoteImageAlt} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover object-[center_35%]" />
                      <div aria-hidden className="absolute inset-0 bg-[#142438]/30" />
                    </div>
                  ) : null}
                  <blockquote className="relative m-0 -mt-14 mx-4 mb-4 rounded-[14px] border border-line bg-white p-5 shadow-[0_12px_28px_-18px_rgba(20,36,56,0.4)]">
                    <span aria-hidden className="display-serif text-[40px] leading-none text-[var(--color-gold)]">
                      “
                    </span>
                    <p className="m-0 mt-1 text-[15px] leading-[1.55] text-ink">{page.quote}</p>
                    <figcaption className="m-0 mt-3 text-[13px] font-medium text-ink-2">— {page.quoteAttribution}</figcaption>
                  </blockquote>
                </figure>
              ) : null}
            </div>

            <div id="enquiry">
              <EmployerRegistrationWizard copy={page} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale="en" />
    </div>
  );
}
