import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleToggle } from './LocaleToggle';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { getSiteSettings } from '@/lib/cms/data';
import { getViewer } from '@/lib/auth';
import { MarketNav } from '@/components/candidate/MarketNav';
import { MarketMenuDrawer } from '@/components/candidate/MarketMenuDrawer';
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
 * Public header aligned to the HTML-44 pack: navy topline, white sticky nav,
 * gold primary CTA. Navigation and announcement still come from Site settings.
 */
export async function SiteHeader({ locale }: { locale: Locale }) {
  const settings = await getSiteSettings();
  const { announcement, navigation, general, footer } = settings;
  const navSize = locale === 'en' ? 'text-[13px]' : 'text-[12px] xl:text-[13px]';
  const navGap = locale === 'en' ? 'gap-[clamp(12px,1.1vw,18px)]' : 'gap-[clamp(8px,0.9vw,14px)]';
  const viewer = await getViewer();
  const showCta = Boolean(navigation.headerCta.label && navigation.headerCta.href) && viewer.role === 'anonymous';
  const showLogin = viewer.role === 'anonymous';
  /* Primary strip keeps the first links; the hamburger drawer holds the rest
     plus footer columns so every public page stays one click away on desktop. */
  const primaryNav = navigation.items.slice(0, 6);
  const moreFromNav = navigation.items.slice(6);
  const drawerSections = [
    {
      title: footer.quickLinksTitle || 'Explore',
      links: [...footer.quickLinks, ...moreFromNav.map((item) => ({ href: item.href, label: navLabel(item, locale) }))],
    },
    { title: footer.companyTitle || 'Company', links: footer.companyLinks },
    { title: 'Legal', links: footer.legalLinks },
    {
      title: 'Also useful',
      links: [
        { label: 'Stay safe', href: '/stay-safe' },
        { label: 'Why Portugal', href: '/why-portugal' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
  ].map((section) => {
    const seen = new Set<string>();
    return {
      ...section,
      links: section.links.filter((link) => {
        const key = link.href.replace(/\/$/, '') || '/';
        if (seen.has(key)) return false;
        seen.add(key);
        return Boolean(link.label && link.href);
      }),
    };
  });

  return (
    <>
      <div className="shop-topline">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-3 px-[clamp(12px,4cqi,26px)]">
          <span>INDIA │ PORTUGAL</span>
          <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            <Link href={localePath(locale, '/signup')}>For Candidates</Link>
            <span aria-hidden>│</span>
            <Link href="/employers">For Employers</Link>
            <span aria-hidden className="hidden text-white/35 sm:inline">
              │
            </span>
            <LocaleToggle locale={locale} tone="topline" />
          </span>
        </div>
      </div>

      {announcement.enabled && announcement.text ? (
        <div className="announce-bar" data-announce="">
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

      <header className="shop-header sticky top-0 z-40 px-[clamp(12px,4cqi,26px)] py-3 sm:py-3.5">
        <div className="mx-auto flex w-full min-w-0 max-w-[1240px] items-center justify-between gap-2 sm:gap-4 md:gap-6">
          <span className="min-w-0 max-w-[min(168px,42vw)] shrink sm:max-w-none">
            <Wordmark href={localePath(locale, '/')} tone="light" size={32} />
          </span>

          <MarketNav
            items={primaryNav.map((item) => ({ href: localHref(locale, item.href), label: navLabel(item, locale) }))}
            className={`hidden min-w-0 flex-1 items-center justify-center ${navGap} ${navSize} font-bold text-[#142438] lg:flex`}
            linkClassName="t-colors whitespace-nowrap border-b-2 border-transparent pb-0.5 text-[#142438] hover:border-[#b28a49] hover:text-[#142438]"
          />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <AccountMenu locale={locale} />
            {showLogin ? (
              <Link
                href={localePath(locale, '/signin')}
                className="t-colors hidden items-center rounded-[5px] border border-[#8098af] bg-white px-3 py-2 text-[12px] font-bold text-[#142438] no-underline hover:bg-[#f4f5f7] lg:inline-flex"
              >
                Log in
              </Link>
            ) : null}
            {showCta ? (
              <Link
                href={localHref(locale, navigation.headerCta.href)}
                className="btn-gradient t-colors hidden items-center gap-1.5 rounded-[5px] px-3.5 py-2 text-[12px] font-bold normal-case tracking-normal no-underline lg:inline-flex"
              >
                {ctaLabel(navigation.headerCta, locale)}
              </Link>
            ) : null}

            <MarketMenuDrawer
              locale={locale}
              sections={drawerSections}
              showLogin={showLogin}
              cta={showCta ? { href: navigation.headerCta.href, label: ctaLabel(navigation.headerCta, locale) } : null}
            />
          </div>
        </div>
      </header>
      <WhatsAppDesk phone={general.whatsapp} locale={locale} copy={whatsappCopy(locale, general.siteName)} />
    </>
  );
}
