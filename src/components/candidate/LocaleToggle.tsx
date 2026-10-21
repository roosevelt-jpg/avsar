'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeLabels, localeNames, locales, type Locale } from '@/lib/i18n';
import { rememberLocale } from '@/lib/i18n/locale-cookie';
import { barePath, localePath } from '@/lib/i18n/path';

/**
 * Language menu. A pill of buttons cannot hold Malayalam, Tamil, Urdu and the
 * other major Indian languages, so this is a native disclosure: it works before
 * JavaScript arrives, and each choice is a real link.
 *
 * English has no prefix. Every other language keeps one.
 */
export function LocaleToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const bare = barePath(pathname);

  return (
    <details className="group relative">
      <summary
        aria-label="Language"
        className="t-colors flex cursor-pointer list-none items-center gap-1 rounded-full border border-[#d5e2ee] bg-[#eef4fa] px-2.5 py-[5px] text-[13px] !text-[#16324f] [&::-webkit-details-marker]:hidden"
      >
        <span lang={locale}>{localeLabels[locale]}</span>
        <svg viewBox="0 0 24 24" className="size-3.5 text-muted group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <ul className="absolute end-0 z-50 m-0 mt-2 max-h-[min(70vh,420px)] w-[220px] list-none overflow-auto rounded-[16px] border border-[#d5e2ee] bg-[#eef4fa] p-1.5 shadow-[0_24px_60px_-24px_rgba(22,50,79,0.45)]">
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
                className={`t-colors flex items-center justify-between gap-3 rounded-[12px] px-3 py-2 text-[15px] no-underline ${
                  active ? 'bg-[#16324f] !text-[#f4f8fb]' : '!text-[#16324f] hover:bg-[#dce7f2]'
                }`}
              >
                <span>{localeNames[code]}</span>
                <span className={`font-mono text-[11px] uppercase ${active ? 'text-white/70' : 'text-muted'}`}>{code}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
