import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleToggle } from './LocaleToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { getSiteSettings } from '@/lib/cms/data';
import { getViewer } from '@/lib/auth';
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
        <div className="bg-night px-[clamp(20px,4cqi,56px)] py-2.5 text-center text-[13px] leading-[1.45] text-dark-muted-2">
          <span>{announcement.text}</span>
          {announcement.href && announcement.linkLabel ? (
            <>
              {' '}
              <Link href={localHref(locale, announcement.href)} className="font-medium text-on-night underline underline-offset-[3px] hover:text-accent-on-dark">
                {announcement.linkLabel}
              </Link>
            </>
          ) : null}
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 px-[clamp(20px,4cqi,56px)] py-[14px] backdrop-blur-md">
        {/* Nothing in the bar may wrap: a two-line "Visa & relocation" doubles
            the header height. The full menu appears only from xl, where six
            links, the toggles and the button fit on one line; below that the
            menu button carries them. */}
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 whitespace-nowrap">
          <Wordmark href={localePath(locale, '/')} size={26} />

          <nav aria-label="Main" className={`hidden min-w-0 items-center gap-[clamp(12px,1.3vw,20px)] text-[14.5px] text-ink-2 ${wide}`}>
            {navigation.items.map((item) => (
              <Link key={item.href} href={localHref(locale, item.href)} className="t-colors no-underline hover:text-accent">
                {navLabel(item, locale)}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3 [&>*]:shrink-0">
            <a
              href={`tel:${general.supportPhone.replace(/\s/g, '')}`}
              dir="ltr"
              className="t-colors hidden whitespace-nowrap font-mono text-[13px] tabular-nums text-ink-2 no-underline hover:text-accent 2xl:inline"
            >
              {general.supportPhone}
            </a>
            <LocaleToggle locale={locale} />
            <ThemeToggle className="hidden sm:grid" />
            <AccountMenu locale={locale} />
            {showCta ? (
              <Link
                href={localHref(locale, navigation.headerCta.href)}
                className="t-colors hidden rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-paper no-underline hover:bg-ink-hover md:inline-flex"
              >
                {ctaLabel(navigation.headerCta, locale)}
              </Link>
            ) : null}

            <details className={`group relative ${narrow}`}>
              <summary
                aria-label="Menu"
                className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-line-strong bg-surface [&::-webkit-details-marker]:hidden"
              >
                <svg viewBox="0 0 24 24" className="size-5 group-open:hidden" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
                <svg viewBox="0 0 24 24" className="hidden size-5 group-open:block" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </summary>
              <div className="absolute end-0 top-12 w-[min(86vw,320px)] rounded-[20px] border border-line bg-surface p-3 shadow-[0_24px_60px_-24px_rgba(27,26,23,0.4)]">
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
                    className="mt-3 flex justify-center rounded-full bg-ink px-4 py-3 text-[15px] font-medium text-paper no-underline"
                  >
                    {ctaLabel(navigation.headerCta, locale)}
                  </Link>
                ) : null}
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
