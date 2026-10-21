import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleToggle } from './LocaleToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { getSiteSettings } from '@/lib/cms/data';
import { getViewer } from '@/lib/auth';
import { MarketNav } from '@/components/candidate/MarketNav';
import { WhatsAppDesk } from '@/components/candidate/WhatsAppDesk';
import { ctaLabel, localHref, navLabel } from '@/lib/cms/settings';

/**
 * The header on every candidate page.
 *
 * Navigation, the announcement bar and the header button come from Site
 * settings in the console, so marketing can change them without a deploy.
 * The mobile menu is a native <details>, so it works before any JavaScript
 * has arrived on a slow connection.
 */
export async function SiteHeader({ locale }: { locale: Locale }) {
  const settings = await getSiteSettings();
  const { announcement, navigation, general } = settings;
  /* The sign-up button is for visitors. Anyone signed in already has an
     account, and their name and links take its place in the bar. */
  /* English menu labels fit on one line from xl. Tamil, Malayalam and the
     other scripts run two to three times longer and ran into the buttons on
     the right, so they keep the menu button until 2xl. Literal class names,
     so Tailwind sees them. */
  const wide = locale === 'en' ? 'xl:flex' : '2xl:flex';
  const narrow = locale === 'en' ? 'xl:hidden' : '2xl:hidden';
  const showCta = Boolean(navigation.headerCta.label && navigation.headerCta.href) && (await getViewer()).role === 'anonymous';

  return (
    <>
      {announcement.enabled && announcement.text ? (
        <div className="bg-night px-[clamp(20px,4cqi,56px)] py-2.5 text-center text-[13px] font-medium leading-[1.45] text-on-night">
          <span>{announcement.text}</span>
          {announcement.href && announcement.linkLabel ? (
            <>
              {' '}
              <Link href={localHref(locale, announcement.href)} className="font-semibold text-white underline underline-offset-[3px]">
                {announcement.linkLabel}
              </Link>
            </>
          ) : null}
        </div>
      ) : null}

      <header className="shop-header sticky top-0 z-40 bg-[#16324f] px-[clamp(12px,4cqi,56px)] py-[12px] text-[#f4f8fb] backdrop-blur-md sm:py-[14px] [&_.text-ink]:text-[#f4f8fb] [&_.text-ink-2]:text-[#e4eef5]">
        {/* Nothing in the bar may wrap: a two-line "Visa & relocation" doubles
            the header height. The full menu appears only from xl, where six
            links, the toggles and the button fit on one line; below that the
            menu button carries them. */}
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 whitespace-nowrap sm:gap-6">
          <Wordmark href={localePath(locale, '/')} tone="dark" size={22} />

          <MarketNav
            items={navigation.items.map((item) => ({ href: localHref(locale, item.href), label: navLabel(item, locale) }))}
            className={`hidden min-w-0 items-center gap-[clamp(12px,1.3vw,20px)] text-[14.5px] font-medium ${wide}`}
            linkClassName="t-colors no-underline hover:text-white"
          />

          <div className="flex shrink-0 items-center gap-3 [&>*]:shrink-0">
            <a
              href={`tel:${general.supportPhone.replace(/\s/g, '')}`}
              dir="ltr"
              className="t-colors hidden whitespace-nowrap font-mono text-[13px] tabular-nums text-dark-muted-2 no-underline hover:text-white 2xl:inline"
            >
              {general.supportPhone}
            </a>
            <LocaleToggle locale={locale} />
            <ThemeToggle className="hidden sm:grid" />
            <AccountMenu locale={locale} />
            {showCta ? (
              <Link
                href={localHref(locale, navigation.headerCta.href)}
                className="btn-gradient t-colors hidden rounded-[14px] px-4 py-2 text-[14px] font-semibold text-white no-underline md:inline-flex"
              >
                {ctaLabel(navigation.headerCta, locale)}
              </Link>
            ) : null}

            <details className={`group relative ${narrow}`}>
              <summary
                aria-label="Menu"
                className="grid size-10 cursor-pointer list-none place-items-center rounded-[4px] border border-line bg-surface text-ink [&::-webkit-details-marker]:hidden"
              >
                <svg viewBox="0 0 24 24" className="size-5 group-open:hidden" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
                <svg viewBox="0 0 24 24" className="hidden size-5 group-open:block" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </summary>
              <div className="absolute end-0 top-12 w-[min(86vw,320px)] rounded-[20px] border border-[#d5e2ee] bg-[#eef4fa] p-3 text-[#16324f] shadow-[0_24px_60px_-24px_rgba(22,50,79,0.4)] [&_.text-ink]:!text-[#16324f] [&_.text-ink-2]:!text-[#3d5168]">
                <nav aria-label="Mobile" className="flex flex-col">
                  {navigation.items.map((item) => (
                    <Link
                      key={item.href}
                      href={localHref(locale, item.href)}
                      className="t-colors rounded-[12px] px-3 py-3 text-[16px] text-ink no-underline hover:bg-paper"
                    >
                      {navLabel(item, locale)}
                    </Link>
                  ))}
                </nav>
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-line px-3 pt-3">
                  <ThemeToggle className="sm:hidden" />
                  <a href={`tel:${general.supportPhone.replace(/\s/g, '')}`} dir="ltr" className="font-mono text-[13px] text-ink-2 no-underline">
                    {general.supportPhone}
                  </a>
                </div>
                {showCta ? (
                  <Link
                    href={localHref(locale, navigation.headerCta.href)}
                    className="btn-gradient mt-3 flex justify-center rounded-[14px] px-4 py-3 text-[15px] font-semibold text-white no-underline"
                  >
                    {ctaLabel(navigation.headerCta, locale)}
                  </Link>
                ) : null}
              </div>
            </details>
          </div>
        </div>
      </header>
      <WhatsAppDesk company={general.siteName} phone={general.whatsapp} hours={general.officeHours} />
    </>
  );
}
