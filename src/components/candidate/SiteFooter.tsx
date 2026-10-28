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

const LINK = 't-colors text-[14px] font-bold uppercase leading-[1.35] text-white no-underline hover:underline';

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="min-w-0">
      <h2 className="m-0 mb-4 text-[14px] font-medium text-[#c96a4b]">{title}</h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {links.map((item) =>
          item.external ? (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                {item.label}
              </a>
            </li>
          ) : (
            <li key={item.href}>
              <Link href={item.href} className={LINK}>
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

/** The outlined action on the dark band. Same shape as a recruitment-site footer button. */
function FooterAction({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  const className = 't-colors inline-flex items-center gap-2 rounded-full border border-[#c96a4b] bg-[#16324f] px-6 py-2 text-[14px] font-bold uppercase tracking-[0.04em] text-white no-underline hover:bg-[#1c4064]';
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
        <span aria-hidden className="rtl:-scale-x-100">→</span>
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
      <span aria-hidden className="rtl:-scale-x-100">→</span>
    </Link>
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
        { href: page('/for-your-family'), label: label('forYourFamily') },
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

  const contactHref = page('/contact');

  return (
    /* Navy stays the brand colour. The arrangement follows a recruitment
       footer: three prompts, then the logo beside the link columns, then a
       thin legal line. Every link is one this site already had. */
    <footer className="bg-[#16324f] text-white">
      <div className="border-b border-white/15">
        <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-[clamp(20px,4cqi,32px)] py-16 md:grid-cols-3">
          <div>
            <h2 className="m-0 text-[22px] font-medium leading-[1.25] text-[#c96a4b]">{label('getStarted')}</h2>
            <p className="m-0 mt-3 text-[15px] leading-[1.5] text-white/85">{settings.footer.blurb}</p>
            {cta.href && ctaLabel ? (
              <div className="mt-6">
                <FooterAction href={localHref(locale, cta.href)} label={ctaLabel} />
              </div>
            ) : null}
          </div>
          <div>
            <h2 className="m-0 text-[22px] font-medium leading-[1.25] text-[#c96a4b]">{label('contact')}</h2>
            <p className="m-0 mt-3 text-[15px] leading-[1.5] text-white/85">{settings.general.officeHours}</p>
            <div className="mt-6 flex flex-col items-start gap-3">
              {settings.general.whatsapp ? (
                <FooterAction href={whatsappHref(settings.general.whatsapp)} label={label('whatsapp')} external />
              ) : (
                <FooterAction href={contactHref} label={label('contact')} />
              )}
              {settings.general.whatsapp ? (
                <a href={whatsappHref(settings.general.whatsapp)} target="_blank" rel="noopener noreferrer" dir="ltr" className="t-colors text-[14px] text-white no-underline hover:underline">
                  WhatsApp {settings.general.whatsapp}
                </a>
              ) : null}
              <a href={`mailto:${settings.general.supportEmail}`} className="t-colors break-all text-[14px] text-white no-underline hover:underline">
                {settings.general.supportEmail}
              </a>
            </div>
          </div>
          <div>
            <h2 className="m-0 text-[22px] font-medium leading-[1.25] text-[#c96a4b]">{label('subscribeTitle')}</h2>
            <p className="m-0 mt-3 mb-6 text-[15px] leading-[1.5] text-white/85">{label('subscribeNote')}</p>
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
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-[clamp(20px,4cqi,32px)] py-16 lg:flex-row lg:gap-16">
        <div className="shrink-0 lg:w-[200px]">
          <Wordmark href={localePath(locale, '/')} tone="dark" size={28} />
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          {columns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}
        </div>
      </div>

      {/*
        Who is actually being paid: the legal name, licence number and
        registered address in full. The company a candidate pays is not the
        name above the door, and they should not find that out from their
        bank statement. Payment providers' compliance reviews look for it
        here too.
      */}
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-1 px-[clamp(20px,4cqi,32px)] pb-10 text-[13px] leading-[1.7] text-white/70">
        <p className="m-0">
          {company.legalName} · {company.registrationLabel} {company.registrationNumber} · {company.registeredAddress}
        </p>
        <p className="m-0">
          Trading as {company.tradingAs}. Charges appear as {company.statementDescriptor}.
          {company.phone && (
            <>
              {' '}
              <a href={`tel:${company.phone.replace(/\s/g, '')}`} dir="ltr" className="t-colors text-white hover:underline">
                {company.phone}
              </a>
            </>
          )}
          {company.supportEmail && (
            <>
              {' · '}
              <a href={`mailto:${company.supportEmail}`} className="t-colors text-white hover:underline">
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

      <div className="border-t border-white/15">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-[clamp(20px,4cqi,32px)] py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3">
            {company.parentBrand && (
              <a href={company.website || undefined} target="_blank" rel="noopener noreferrer" className="t-colors opacity-80 hover:opacity-100">
                <Image src="/smith-adams-group-light-320.png" alt={`${company.parentBrand} Group`} width={320} height={68} className="h-auto w-[120px]" />
              </a>
            )}
            <p className="m-0 text-[14px] text-white">{t.footerLegal}</p>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
            {legal.map((item) => (
              <Link key={item.href} href={item.href} className="t-colors text-white no-underline hover:underline">
                {item.label}
              </Link>
            ))}
            {settings.general.tagline ? <span className="text-white/70">{settings.general.tagline}</span> : null}
          </nav>
          {socials.length > 0 && (
            <ul className="m-0 flex list-none gap-4 p-0">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name} className="t-colors grid size-6 place-items-center text-white hover:opacity-70">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {SOCIAL_ICONS[name] ?? <circle cx="12" cy="12" r="8" />}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
