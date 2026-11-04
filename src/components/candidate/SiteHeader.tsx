import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleToggle } from './LocaleToggle';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { getSiteSettings } from '@/lib/cms/data';
import { getViewer } from '@/lib/auth';
import { MarketNav } from '@/components/candidate/MarketNav';
import { WhatsAppDesk, type WhatsAppDeskCopy } from '@/components/candidate/WhatsAppDesk';
import { WHATSAPP_LABELS } from '@/lib/cms/interface-copy';
import { siteText } from '@/lib/cms/localize';
import { ctaLabel, localHref, navLabel } from '@/lib/cms/settings';

/** Window copy for this page's language. The draft on WhatsApp uses the same language. */
function whatsappCopy(locale: Locale, company: string): WhatsAppDeskCopy {
  const line = (english: string) => siteText(locale, english).replaceAll('{{company}}', company);
  return {
    title: line(WHATSAPP_LABELS.title),
    intro: line(WHATSAPP_LABELS.intro),
    ask: line(WHATSAPP_LABELS.ask),
    send: line(WHATSAPP_LABELS.send),
    fromNotes: line(WHATSAPP_LABELS.fromNotes),
    close: line(WHATSAPP_LABELS.close),
    allDesks: line(WHATSAPP_LABELS.allDesks),
    continue: line(WHATSAPP_LABELS.continue),
    desks: [
      { id: 'jobs', title: line(WHATSAPP_LABELS.jobsTitle), body: line(WHATSAPP_LABELS.jobsBody), text: line(WHATSAPP_LABELS.jobsText) },
      { id: 'visa', title: line(WHATSAPP_LABELS.visaTitle), body: line(WHATSAPP_LABELS.visaBody), text: line(WHATSAPP_LABELS.visaText) },
      { id: 'pay', title: line(WHATSAPP_LABELS.payTitle), body: line(WHATSAPP_LABELS.payBody), text: line(WHATSAPP_LABELS.payText) },
    ],
  };
}

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
        <div className="announce-bar">
          <p className="announce-item">
            <span className="announce-dot" aria-hidden />
            <span>{announcement.text}</span>
            {announcement.href && announcement.linkLabel ? (
              <Link href={localHref(locale, announcement.href)} className="font-semibold text-[#b28a49] underline underline-offset-[3px]">
                {announcement.linkLabel}
              </Link>
            ) : null}
          </p>
        </div>
      ) : null}

      <header className="shop-header sticky top-0 z-40 px-[clamp(16px,4cqi,56px)] py-4">
        {/* Mockup header: large wordmark, white nav, outline Sign in, gold CTA. */}
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 whitespace-nowrap sm:gap-6">
          <Wordmark href={localePath(locale, '/')} tone="dark" size={40} />

          <MarketNav
            items={navigation.items.map((item) => ({ href: localHref(locale, item.href), label: navLabel(item, locale) }))}
            className={`hidden min-w-0 items-center gap-[clamp(14px,1.4vw,22px)] text-[15px] font-medium text-white ${wide}`}
            linkClassName="t-colors text-white/95 hover:text-[var(--color-gold)]"
          />

          <div className="flex shrink-0 items-center gap-3 [&>*]:shrink-0">
            <LocaleToggle locale={locale} />
            <AccountMenu locale={locale} />
            {showCta ? (
              <Link
                href={localHref(locale, navigation.headerCta.href)}
                className="btn-gradient t-colors hidden items-center gap-1.5 rounded-[8px] px-4 py-2.5 text-[14px] font-semibold normal-case tracking-normal no-underline md:inline-flex"
              >
                {ctaLabel(navigation.headerCta, locale)}
                <span aria-hidden>→</span>
              </Link>
            ) : null}

            <details className={`group relative ${narrow}`}>
              <summary
                aria-label="Menu"
                className="grid size-10 cursor-pointer list-none place-items-center rounded-[8px] border border-white/55 bg-transparent text-white [&::-webkit-details-marker]:hidden"
              >
                <svg viewBox="0 0 24 24" className="size-5 group-open:hidden" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
                <svg viewBox="0 0 24 24" className="hidden size-5 group-open:block" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </summary>
              <div className="absolute end-0 top-12 w-[min(86vw,320px)] rounded-[12px] border border-white/20 bg-[#142438] p-3 text-white shadow-[0_24px_60px_-24px_rgba(8,20,36,0.7)]">
                <nav aria-label="Mobile" className="flex flex-col">
                  {navigation.items.map((item) => (
                    <Link
                      key={item.href}
                      href={localHref(locale, item.href)}
                      className="t-colors rounded-[8px] px-3 py-3 text-[16px] text-white no-underline hover:bg-white/10"
                    >
                      {navLabel(item, locale)}
                    </Link>
                  ))}
                </nav>
                {showCta ? (
                  <Link
                    href={localHref(locale, navigation.headerCta.href)}
                    className="btn-gradient mt-3 flex items-center justify-center gap-1.5 rounded-[8px] px-4 py-3 text-[14px] font-semibold normal-case tracking-normal no-underline"
                  >
                    {ctaLabel(navigation.headerCta, locale)}
                    <span aria-hidden>→</span>
                  </Link>
                ) : null}
              </div>
            </details>
          </div>
        </div>
      </header>
      <WhatsAppDesk phone={general.whatsapp} hours={general.officeHours} copy={whatsappCopy(locale, general.siteName)} />
    </>
  );
}
