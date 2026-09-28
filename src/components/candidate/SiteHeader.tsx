import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleToggle } from './LocaleToggle';
import { getDictionary, type Locale } from '@/lib/i18n';

export function SiteHeader({ locale }: { locale: Locale }) {
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
      <div className="flex items-center gap-2">
        <LocaleToggle locale={locale} />
        <Link href={`/${locale}/dashboard`} className="px-2.5 py-2 text-[15px] no-underline text-ink">
          {t.signIn}
        </Link>
      </div>
    </header>
  );
}
