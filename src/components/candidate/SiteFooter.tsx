import Image from 'next/image';
import Link from 'next/link';
import { BRAND, ENTITY } from '@/lib/data/brand';
import { getDictionary, type Locale, localePath } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/cms/data';
import { localHref, navLabel, whatsappHref } from '@/lib/cms/settings';

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const settings = await getSiteSettings();
  const socials = Object.entries(settings.general.socials).filter(([, url]) => url);
  const links = [
    { href: localePath(locale, '/terms'), label: t.footerTerms },
    { href: localePath(locale, '/refund-policy'), label: t.footerRefund },
    { href: localePath(locale, '/delivery'), label: t.footerDelivery },
    { href: localePath(locale, '/privacy'), label: t.footerPrivacy },
    { href: localePath(locale, '/selection-rules'), label: t.selectionRules },
    { href: localePath(locale, '/contact'), label: t.footerContact },
  ];

  return (
    <footer className="bg-ink px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,64px)] text-dark-muted-2">
      {/* One mark in the footer, and it is the parent's. The recruitment
          wordmark is already in the header of every page; repeating it here
          competed with the thing that actually lends credibility. */}
      {/* Site map and contact, from Site settings. */}
      <div className="mb-10 grid gap-8 border-b border-dark-line pb-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="m-0 text-[20px] font-semibold text-paper">{settings.general.siteName}</p>
          <p className="m-0 mt-3 max-w-[46ch] text-[15px] leading-[1.6]">{settings.footer.blurb}</p>
          {socials.length > 0 && (
            <ul className="m-0 mt-5 flex list-none flex-wrap gap-3 p-0">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="t-colors rounded-full border border-dark-line px-3 py-1.5 text-[13px] capitalize text-dark-muted-2 no-underline hover:border-paper hover:text-paper">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2.5 text-[15px]">
          {settings.navigation.items.map((item) => (
            <Link key={item.href} href={localHref(locale, item.href)} className="t-colors text-dark-muted-2 no-underline hover:text-paper">
              {navLabel(item, locale)}
            </Link>
          ))}
          <Link href={localHref(locale, '/about')} className="t-colors text-dark-muted-2 no-underline hover:text-paper">About us</Link>
          <Link href={localHref(locale, '/stay-safe')} className="t-colors text-dark-muted-2 no-underline hover:text-paper">Stay safe from fraud</Link>
        </nav>
        <div className="flex flex-col gap-2.5 text-[15px]">
          {settings.general.whatsapp && (
            <a href={whatsappHref(settings.general.whatsapp)} target="_blank" rel="noopener noreferrer" dir="ltr" className="t-colors text-dark-muted-2 no-underline hover:text-paper">
              WhatsApp {settings.general.whatsapp}
            </a>
          )}
          <a href={`mailto:${settings.general.supportEmail}`} className="t-colors text-dark-muted-2 no-underline hover:text-paper">
            {settings.general.supportEmail}
          </a>
          <p className="m-0 text-[14px] text-dark-muted">{settings.general.officeHours}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-dark-muted-2 underline underline-offset-[3px] hover:text-paper t-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {/*
        The parent mark. A candidate abroad is being asked to send money to a
        company they have never heard of, and the one thing that makes that
        reasonable is that it belongs to a business with a name and an address.
        Hiding the parent would be the strange choice.

        Served at 320 wide and rendered at 160, so it stays sharp on a phone.
      */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-dark-line pt-6">
        <a
          href="https://www.smithandadams.com"
          target="_blank"
          rel="noopener noreferrer"
          className="t-colors opacity-70 hover:opacity-100"
        >
          <Image
            src="/smith-adams-group-light-320.png"
            alt={`${BRAND.parent} Group`}
            width={320}
            height={68}
            className="h-auto w-[160px]"
          />
        </a>
        <p className="m-0 font-mono text-[12px] tracking-[0.04em] text-dark-muted">
          {BRAND.slogan}
        </p>
        <p className="m-0 font-mono text-[12px] text-dark-muted">{t.footerLegal}</p>
      </div>

      {/*
        Who is actually being paid.

        The legal name, the licence number and the registered address, in full,
        because the company a candidate pays is not the name above the door and
        they should not have to find that out from their bank statement. It is
        also the first thing a payment provider's compliance review looks for on
        a live site, and the cheapest place to put it is where it already
        belongs.
      */}
      <div className="mt-6 flex flex-col gap-1 border-t border-dark-line pt-6 font-mono text-[12px] leading-[1.6] text-dark-muted">
        <p className="m-0">
          {ENTITY.legalName} · {ENTITY.registrationLabel} {ENTITY.registrationNumber}
        </p>
        <p className="m-0">{ENTITY.registeredAddress}</p>
        <p className="m-0">
          <a href={`tel:${ENTITY.phone.replace(/\s/g, '')}`} className="hover:text-paper t-colors">
            {ENTITY.phone}
          </a>
          {' · '}
          <a href={`mailto:${ENTITY.supportEmail}`} className="hover:text-paper t-colors">
            {ENTITY.supportEmail}
          </a>
        </p>
        <p className="m-0">
          Trading as {ENTITY.tradingAs}. Charges appear as {ENTITY.statementDescriptor}.
        </p>
      </div>
    </footer>
  );
}
