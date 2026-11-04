'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeLabels, localeNames, locales, type Locale } from '@/lib/i18n';
import { rememberLocale } from '@/lib/i18n/locale-cookie';
import { barePath, localePath } from '@/lib/i18n/path';

/**
 * Language menu matched to the mockup header: outline control with a globe,
 * native disclosure so it works before JavaScript arrives.
 */
export function LocaleToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const bare = barePath(pathname);

  return (
    <details className="group relative">
      <summary
        aria-label="Language"
        className="t-colors flex cursor-pointer list-none items-center gap-1.5 rounded-[8px] border border-white/55 bg-transparent px-2.5 py-2 text-[13px] font-medium text-white [&::-webkit-details-marker]:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18 M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" />
        </svg>
        <span lang={locale}>{localeLabels[locale]}</span>
        <svg viewBox="0 0 24 24" className="size-3.5 text-white/80 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <ul className="absolute end-0 z-50 m-0 mt-2 max-h-[min(70vh,420px)] w-[220px] list-none overflow-auto rounded-[12px] border border-[#142438]/12 bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(20,36,56,0.45)]">
        {locales.map((code) => {
          const active = code === locale;
          return (
            <li key={code}>
              <Link
                href={localePath(code, bare)}
                hrefLang={code}
                lang={code}
                aria-current={active ? 'true' : undefined}
                onClick={() => rememberLocale(code)}
                className={`t-colors flex items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-[15px] no-underline ${
                  active ? 'bg-[#142438] text-white' : 'text-[#142438] hover:bg-[#f7f4ee]'
                }`}
              >
                <span>{localeNames[code]}</span>
                <span className={`font-mono text-[11px] uppercase ${active ? 'text-white/70' : 'text-[#5c7084]'}`}>{code}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
