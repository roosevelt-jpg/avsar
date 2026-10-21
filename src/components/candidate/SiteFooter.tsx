import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/ui/Wordmark';
import { FooterSubscribe } from '@/components/candidate/FooterSubscribe';
import { getDictionary, type Locale, localePath } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/cms/data';
import { localHref, navLabel, whatsappHref } from '@/lib/cms/settings';
import { siteText } from '@/lib/cms/localize';
import { FOOTER_LABELS } from '@/lib/cms/interface-copy';

/* Simple outline marks for the social buttons, drawn on a 24px grid so they
   match the stroke icons elsewhere on the site without an icon library. */
const SOCIAL_ICONS: Record<string, ReactNode> = {
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" />
    </>
  ),
  facebook: <path d="M14 8h2.5V4.5H14A3.5 3.5 0 0010.5 8v2.5H8V14h2.5v6H14v-6h2.5l.5-3.5h-3V8z" />,
  linkedin: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 10.5V16 M8 7.6v.1 M11.5 16v-5.5 M11.5 13c0-1.5 1-2.5 2.3-2.5S16 11.3 16 13v3" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="4" />
      <path d="M10.5 9.5v5l4-2.5-4-2.5z" fill="currentColor" />
    </>
  ),
};

type FooterLink = { href: string; label: string; external?: boolean };

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="min-w-0">
      <h2 className="m-0 mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-on-night">{title}</h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
        {links.map((item) =>
          item.external ? (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="t-colors text-dark-muted-2 no-underline hover:text-on-night">
                {item.label}
              </a>
            </li>
          ) : (
            <li key={item.href}>
              <Link href={item.href} className="t-colors text-dark-muted-2 no-underline hover:text-on-night">
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const settings = await getSiteSettings();
  const { company } = settings;
  const partner = company.partner;
  const socials = Object.entries(settings.general.socials).filter(([, url]) => url);
  const cta = settings.navigation.headerCta;
  const ctaLabel = cta.labels?.[locale] || cta.label;
  const page = (path: string) => localHref(locale, path);
  const label = (key: keyof typeof FOOTER_LABELS) => siteText(locale, FOOTER_LABELS[key]);

  /* The first column is the site menu from Settings › Navigation, so the
     footer never lists a page the header has dropped. The rest are fixed
     pages every install has. */
  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: label('explore'),
      links: settings.navigation.items.map((item) => ({ href: localHref(locale, item.href), label: navLabel(item, locale) })),
    },
    {
      title: label('getStarted'),
      links: [
        { href: page('/signup'), label: label('createProfile') },
        { href: page('/applicant/signin'), label: label('signIn') },
        { href: page('/pricing'), label: label('pricing') },
        { href: page('/employers'), label: label('hire') },
      ],
    },
    {
      title: label('helpSafety'),
      links: [
        { href: page('/stay-safe'), label: label('staySafe') },
        { href: localePath(locale, '/selection-rules'), label: t.selectionRules },
        { href: localePath(locale, '/contact'), label: t.footerContact },
      ],
    },
    {
      title: label('company'),
      links: [
        { href: page('/about'), label: label('about') },
        { href: localePath(locale, '/terms'), label: t.footerTerms },
        { href: localePath(locale, '/privacy'), label: t.footerPrivacy },
        { href: localePath(locale, '/refund-policy'), label: t.footerRefund },
        { href: localePath(locale, '/delivery'), label: t.footerDelivery },
      ],
    },
  ];

  const legal = [
    { href: localePath(locale, '/terms'), label: t.footerTerms },
    { href: localePath(locale, '/privacy'), label: t.footerPrivacy },
    { href: localePath(locale, '/refund-policy'), label: t.footerRefund },
  ];

  return (
    <footer className="bg-night px-[clamp(20px,4cqi,56px)] text-dark-muted-2">
      <div className="mx-auto max-w-[1280px]">
        {/* The closing call to action: one last, plain way in for anyone who
            scrolled to the bottom still deciding. */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-dark-line py-[clamp(40px,6cqi,72px)] lg:flex-row lg:items-end">
          <div className="max-w-[640px]">
            <Wordmark href={localePath(locale, '/')} tone="dark" size={34} />
            <p className="m-0 mt-4 text-[16px] leading-[1.6]">{settings.footer.blurb}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {cta.href && ctaLabel ? (
              <Link
                href={localHref(locale, cta.href)}
                className="t-colors inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-[15px] font-semibold text-white no-underline hover:bg-accent-deep"
              >
                {ctaLabel}
                <span aria-hidden className="rtl:-scale-x-100">→</span>
              </Link>
            ) : null}
            {settings.general.whatsapp && (
              <a
                href={whatsappHref(settings.general.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="t-colors inline-flex items-center rounded-full border border-dark-line px-6 py-3.5 text-[15px] font-semibold text-on-night no-underline hover:border-on-night"
              >
                {label('whatsapp')}
              </a>
            )}
          </div>
        </div>

        {/* Link columns, then contact. Two columns on a phone so the whole
            map fits in a couple of screens instead of one long list. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-[clamp(40px,5cqi,64px)] md:grid-cols-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.3fr)]">
          {columns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}
          <div className="col-span-2 min-w-0 md:col-span-1">
            <h2 className="m-0 mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-on-night">{label('contact')}</h2>
            <div className="flex flex-col gap-3 text-[15px]">
              {settings.general.whatsapp && (
                <a href={whatsappHref(settings.general.whatsapp)} target="_blank" rel="noopener noreferrer" dir="ltr" className="t-colors text-dark-muted-2 no-underline hover:text-on-night">
                  WhatsApp {settings.general.whatsapp}
                </a>
              )}
              <a href={`mailto:${settings.general.supportEmail}`} className="t-colors break-all text-dark-muted-2 no-underline hover:text-on-night">
                {settings.general.supportEmail}
              </a>
              <p className="m-0 text-[14px] text-dark-muted">{settings.general.officeHours}</p>
            </div>
            {socials.length > 0 && (
              <ul className="m-0 mt-6 flex list-none flex-wrap gap-2.5 p-0">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                      title={name}
                      className="t-colors grid size-10 place-items-center rounded-full border border-dark-line text-dark-muted-2 hover:border-on-night hover:text-on-night"
                    >
                      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        {SOCIAL_ICONS[name] ?? <circle cx="12" cy="12" r="8" />}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/*
          Who is actually being paid: the legal name, licence number and
          registered address in full. The company a candidate pays is not the
          name above the door, and they should not find that out from their
          bank statement. Payment providers' compliance reviews look for it
          here too.
        */}
        <div className="grid gap-8 border-t border-dark-line pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-16">
        <div className="flex flex-col gap-1 text-[12.5px] leading-[1.7] text-dark-muted">
          <p className="m-0">
            {company.legalName} · {company.registrationLabel} {company.registrationNumber} · {company.registeredAddress}
          </p>
          <p className="m-0">
            Trading as {company.tradingAs}. Charges appear as {company.statementDescriptor}.
            {company.phone && (
              <>
                {' '}
                <a href={`tel:${company.phone.replace(/\s/g, '')}`} dir="ltr" className="t-colors hover:text-on-night">
                  {company.phone}
                </a>
              </>
            )}
            {company.supportEmail && (
              <>
                {' · '}
                <a href={`mailto:${company.supportEmail}`} className="t-colors hover:text-on-night">
                  {company.supportEmail}
                </a>
              </>
            )}
          </p>
          {partner.legalName && (
            <p className="m-0">
              Placement partner in Portugal: {partner.legalName} · {partner.registrationLabel} {partner.registrationNumber} · {partner.address}
            </p>
          )}
          {/* An office at the registered address is already on the first line. */}
          {company.offices
            .filter((office) => office.address.trim().toLowerCase() !== company.registeredAddress.trim().toLowerCase())
            .map((office) => (
            <p key={office.city} className="m-0">
              {office.city} office: {office.address}
            </p>
          ))}
        </div>
          <FooterSubscribe
            locale={locale}
            labels={{
              title: label('subscribeTitle'),
              note: label('subscribeNote'),
              placeholder: label('subscribePlaceholder'),
              button: label('subscribeButton'),
              done: label('subscribeDone'),
              error: label('subscribeError'),
            }}
          />
        </div>

        {/*
          The sign-off: the parent mark, the legal line and the short legal
          links in one row. A candidate abroad is being asked to trust a
          company they have never heard of, and the parent's name and address
          are what make that reasonable. The logo is served at 320 wide and
          shown at 140, so it stays sharp on a phone.
        */}
        <div className="mt-8 flex flex-col gap-5 border-t border-dark-line py-7 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {company.parentBrand && (
              <a href={company.website || undefined} target="_blank" rel="noopener noreferrer" className="t-colors opacity-70 hover:opacity-100">
                <Image src="/smith-adams-group-light-320.png" alt={`${company.parentBrand} Group`} width={320} height={68} className="h-auto w-[140px]" />
              </a>
            )}
            <p className="m-0 text-[13px] text-dark-muted">{t.footerLegal}</p>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            {legal.map((item) => (
              <Link key={item.href} href={item.href} className="t-colors text-dark-muted-2 no-underline hover:text-on-night">
                {item.label}
              </Link>
            ))}
            {settings.general.tagline ? <span className="text-dark-muted">{settings.general.tagline}</span> : null}
          </nav>
        </div>
      </div>
    </footer>
  );
}
