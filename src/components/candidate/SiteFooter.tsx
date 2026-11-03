import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/ui/Wordmark';
import { FooterSubscribe } from '@/components/candidate/FooterSubscribe';
import { Icon } from '@/components/cms/primitives';
import type { Locale } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/cms/data';
import { localHref } from '@/lib/cms/settings';
import { siteText } from '@/lib/cms/localize';
import type { IconName } from '@/lib/cms/blocks';

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
  tiktok: <path d="M14 5c.6 2.2 2.2 3.8 4.5 4.2v2.6c-1.5-.1-2.9-.6-4.1-1.4v5.3A5.3 5.3 0 1110.2 10v2.7a2.7 2.7 0 102.1 2.6V5h1.7z" fill="currentColor" stroke="none" />,
};

function asIcon(name: string): IconName {
  const allowed: IconName[] = [
    'shield',
    'check',
    'rupee',
    'globe',
    'home',
    'chat',
    'briefcase',
    'plane',
    'document',
    'star',
    'clock',
    'users',
    'phone',
    'heart',
    'graduation',
    'map',
    'euro',
  ];
  return (allowed.includes(name as IconName) ? name : 'shield') as IconName;
}

/**
 * Shared marketing footer on every public locale page (and employers).
 *
 * Columns, blurb, trust badges, subscribe copy, legal links and the Lisbon
 * photograph come from Settings › General › Footer so staff can change them
 * without a deploy. Each link should point at a CMS page or live route.
 */
export async function SiteFooter({ locale }: { locale: Locale }) {
  const settings = await getSiteSettings();
  const { company, footer, general } = settings;
  const socials = Object.entries(general.socials).filter(([, url]) => url);
  const year = String(new Date().getFullYear());
  const copyright = footer.copyright
    .replaceAll('{{year}}', year)
    .replaceAll('{{brand}}', general.siteName || company.tradingAs);
  const t = (english: string) => siteText(locale, english);
  const page = (path: string) => localHref(locale, path);

  return (
    <footer className="relative overflow-hidden bg-[#0a088f] text-white">
      {footer.backgroundImage ? (
        <>
          <Image
            src={footer.backgroundImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-45"
            unoptimized={!footer.backgroundImage.startsWith('/')}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#0a088f] via-[#0a088f]/92 to-[#0a088f]/55" />
        </>
      ) : null}

      <div className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,72px)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1fr)]">
        <div>
          <Wordmark href={page('/')} tone="dark" size={28} />
          {footer.blurb ? (
            <p className="m-0 mt-5 max-w-[36ch] text-[14px] leading-[1.55] text-white/85">{t(footer.blurb)}</p>
          ) : null}
          {footer.trustBadges.length > 0 ? (
            <ul className="m-0 mt-6 flex list-none flex-wrap gap-2.5 p-0">
              {footer.trustBadges.map((badge) => (
                <li
                  key={badge.label}
                  className="inline-flex items-center gap-2 rounded-[8px] border border-white/35 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/95"
                >
                  <Icon name={asIcon(badge.icon)} className="size-3.5 text-[var(--color-gold)]" />
                  {t(badge.label)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <FooterLinkColumn title={t(footer.quickLinksTitle)} links={footer.quickLinks.map((item) => ({ ...item, href: page(item.href), label: t(item.label) }))} />
        <FooterLinkColumn title={t(footer.companyTitle)} links={footer.companyLinks.map((item) => ({ ...item, href: page(item.href), label: t(item.label) }))} />

        <div>
          <h2 className="display-serif m-0 text-[22px] font-normal text-white">
            {t(footer.subscribeTitle)}
            <span aria-hidden className="mt-2 block h-px w-10 bg-[var(--color-gold)]" />
          </h2>
          <p className="m-0 mt-4 text-[14px] leading-[1.5] text-white/85">{t(footer.subscribeNote)}</p>
          <div className="mt-5">
            <FooterSubscribe
              locale={locale}
              labels={{
                title: t(footer.subscribeTitle),
                note: t(footer.subscribeNote),
                placeholder: t(footer.subscribePlaceholder),
                button: t('Subscribe'),
                done: t('Thank you. You are on the list.'),
                error: t('That did not work. Check the address and try again.'),
              }}
            />
          </div>
          {socials.length > 0 ? (
            <div className="mt-8">
              <p className="m-0 text-[14px] font-semibold text-white">{t(footer.followTitle)}</p>
              <ul className="m-0 mt-3 flex list-none flex-wrap gap-2.5 p-0">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                      title={name}
                      className="t-colors grid size-10 place-items-center rounded-[10px] border border-white/40 text-white no-underline hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
                    >
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        {SOCIAL_ICONS[name] ?? <circle cx="12" cy="12" r="8" />}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative border-t border-[var(--color-gold)]/55">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-[clamp(20px,4cqi,56px)] py-5 md:flex-row md:items-center md:justify-between">
          <p className="m-0 text-[13px] text-white/85">{copyright}</p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
            {footer.legalLinks.map((item, index) => (
              <span key={item.href} className="inline-flex items-center gap-3">
                {index > 0 ? <span aria-hidden className="text-white/40">|</span> : null}
                <Link href={page(item.href)} className="t-colors text-white/90 no-underline hover:text-[var(--color-gold)] hover:underline">
                  {t(item.label)}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>

      {/* Quiet legal entity line for payments compliance — not part of the mockup chrome. */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,4cqi,56px)] py-4 text-[12px] leading-[1.6] text-white/55">
          <p className="m-0">
            {company.legalName} · {company.registrationLabel} {company.registrationNumber} · {company.registeredAddress}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="min-w-0">
      <h2 className="display-serif m-0 text-[22px] font-normal text-white">
        {title}
        <span aria-hidden className="mt-2 block h-px w-10 bg-[var(--color-gold)]" />
      </h2>
      <ul className="m-0 mt-5 flex list-none flex-col gap-3 p-0">
        {links.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link href={item.href} className="t-colors inline-flex items-center gap-2 text-[14px] text-white/90 no-underline hover:text-[var(--color-gold)]">
              <span aria-hidden className="text-[var(--color-gold)]">
                ›
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
