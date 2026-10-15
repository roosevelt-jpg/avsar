import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleToggle } from './LocaleToggle';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { getSiteSettings } from '@/lib/cms/data';
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

  return (
    <>
      {announcement.enabled && announcement.text ? (
        <div className="bg-ink px-[clamp(20px,4cqi,56px)] py-2.5 text-center text-[13px] leading-[1.45] text-dark-muted-2">
          <span>{announcement.text}</span>
          {announcement.href && announcement.linkLabel ? (
            <>
              {' '}
              <Link href={localHref(locale, announcement.href)} className="font-medium text-paper underline underline-offset-[3px] hover:text-accent-on-dark">
                {announcement.linkLabel}
              </Link>
            </>
          ) : null}
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 px-[clamp(20px,4cqi,56px)] py-[14px] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4">
          <Wordmark href={localePath(locale, '/')} size={26} />

          <nav aria-label="Main" className="hidden items-center gap-[clamp(14px,2cqi,26px)] text-[15px] text-ink-2 lg:flex">
            {navigation.items.map((item) => (
              <Link key={item.href} href={localHref(locale, item.href)} className="t-colors no-underline hover:text-accent">
                {navLabel(item, locale)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${general.supportPhone.replace(/\s/g, '')}`}
              dir="ltr"
              className="t-colors hidden whitespace-nowrap font-mono text-[13px] tabular-nums text-ink-2 no-underline hover:text-accent xl:inline"
            >
              {general.supportPhone}
            </a>
            <LocaleToggle locale={locale} />
            <AccountMenu locale={locale} />
            {navigation.headerCta.label && navigation.headerCta.href ? (
              <Link
                href={localHref(locale, navigation.headerCta.href)}
                className="t-colors hidden rounded-full bg-accent px-4 py-2 text-[14px] font-medium text-white no-underline hover:bg-accent-deep md:inline-flex"
              >
                {ctaLabel(navigation.headerCta, locale)}
              </Link>
            ) : null}

            <details className="group relative lg:hidden">
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
                <div className="mt-2 flex items-center justify-end gap-3 border-t border-line px-3 pt-3">
                  <a href={`tel:${general.supportPhone.replace(/\s/g, '')}`} dir="ltr" className="font-mono text-[13px] text-ink-2 no-underline">
                    {general.supportPhone}
                  </a>
                </div>
                {navigation.headerCta.label && navigation.headerCta.href ? (
                  <Link
                    href={localHref(locale, navigation.headerCta.href)}
                    className="mt-3 flex justify-center rounded-full bg-accent px-4 py-3 text-[15px] font-medium text-white no-underline"
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
