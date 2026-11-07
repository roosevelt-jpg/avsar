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
 * Public footer from the HTML-44 shell: solid navy, four columns (brand,
 * Explore, Company, Stay informed), then a quiet legal bar. Columns and copy
 * come from Settings › Footer so marketing can edit without a deploy.
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
    <footer className="bg-[#142438] text-white">
      <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-[clamp(16px,4cqi,26px)] py-[clamp(40px,6cqi,64px)] sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="inline-block max-w-[min(208px,70vw)]">
            <Wordmark href={page('/')} tone="dark" size={36} />
          </span>
          {footer.blurb ? (
            <p className="m-0 mt-4 max-w-[36ch] text-[14px] leading-[1.55] text-white/88">{t(footer.blurb)}</p>
          ) : null}
          {footer.disclaimer ? (
            <p className="m-0 mt-3 max-w-[36ch] text-[12px] leading-[1.5] text-white/55">{t(footer.disclaimer)}</p>
          ) : null}
          {footer.trustBadges.length > 0 ? (
            <ul className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
              {footer.trustBadges.map((badge) => (
                <li
                  key={badge.label}
                  className="inline-flex max-w-full items-center gap-2 rounded-[6px] border border-white/25 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-white/90"
                >
                  <Icon name={asIcon(badge.icon)} className="size-3.5 text-[var(--color-gold)]" />
                  {t(badge.label)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <FooterLinkColumn
          title={t(footer.quickLinksTitle)}
          links={footer.quickLinks.map((item) => ({ ...item, href: page(item.href), label: t(item.label) }))}
        />
        <FooterLinkColumn
          title={t(footer.companyTitle)}
          links={footer.companyLinks.map((item) => ({ ...item, href: page(item.href), label: t(item.label) }))}
        />

        <div>
          <h2 className="m-0 text-[15px] font-semibold tracking-[-0.02em] text-white">{t(footer.subscribeTitle)}</h2>
          {footer.subscribeNote ? (
            <p className="m-0 mt-3 text-[14px] leading-[1.5] text-white/80">{t(footer.subscribeNote)}</p>
          ) : null}
          <div className="mt-4">
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
            <div className="mt-6">
              <p className="m-0 text-[13px] font-semibold text-white/90">{t(footer.followTitle)}</p>
              <ul className="m-0 mt-2.5 flex list-none flex-wrap gap-2 p-0">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                      title={name}
                      className="t-colors grid size-9 place-items-center rounded-[6px] border border-white/30 text-white no-underline hover:border-white hover:text-white"
                    >
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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

      <div className="border-t border-white/15">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-[clamp(16px,4cqi,26px)] py-4 text-[13px] text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">{copyright}</p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {footer.legalLinks.map((item, index) => (
              <span key={item.href} className="inline-flex items-center gap-2">
                {index > 0 ? <span aria-hidden className="text-white/35">•</span> : null}
                <Link href={page(item.href)} className="t-colors text-white/75 no-underline hover:text-white">
                  {t(item.label)}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="min-w-0">
      <h2 className="m-0 text-[15px] font-semibold tracking-[-0.02em] text-white">{title}</h2>
      <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
        {links.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link href={item.href} className="t-colors text-[14px] text-white/80 no-underline hover:text-white">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
