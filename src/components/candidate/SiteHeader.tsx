import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleToggle } from './LocaleToggle';
import { getDictionary, type Locale } from '@/lib/i18n';
import { ENTITY } from '@/lib/data/brand';
import { AccountMenu } from '@/components/auth/AccountMenu';

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
      <Wordmark href={`/${locale}`} />
      <nav className="flex flex-wrap gap-[clamp(12px,2.4cqi,28px)] text-[15px] text-ink-2">
        <Link href={`/${locale}#how`} className="no-underline hover:text-accent t-colors">
          {t.navHow}
        </Link>
        <Link href={`/${locale}#sectors`} className="no-underline hover:text-accent t-colors">
          {t.navSectors}
        </Link>
        <Link href={`/${locale}/pricing`} className="no-underline hover:text-accent t-colors">
          {t.navPricing}
        </Link>
        <Link href="/employers" className="no-underline hover:text-accent t-colors">
          {t.navEmployers}
        </Link>
      </nav>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/*
          The support line, in the one place it is on every page.

          It was only in the footer, at the very bottom of the page, where it
          works as the company's legal record and as a contact number works not
          at all: somebody deciding whether to trust an unfamiliar recruiter is
          not going to scroll past the whole site to find a number.

          `dir="ltr"` because a phone number is not prose, and it would otherwise
          reorder inside the Arabic layout. `tabular-nums` so the digits do not
          jitter against the rest of the header.
        */}
        <a
          href={`tel:${ENTITY.phone.replace(/\s/g, '')}`}
          dir="ltr"
          className="t-colors whitespace-nowrap font-mono text-[14px] tabular-nums text-ink-2 no-underline hover:text-accent"
        >
          {ENTITY.phone}
        </a>
        <LocaleToggle locale={locale} />
        <AccountMenu locale={locale} />
      </div>
    </header>
  );
}
