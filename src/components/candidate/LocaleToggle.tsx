'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { locales, localeLabels, type Locale } from '@/lib/i18n';

/**
 * EN / हिं pill. Swaps the locale segment in the current path and writes a
 * cookie so the choice survives a later visit to `/`.
 */
export function LocaleToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    document.cookie = `avsar_locale=${next}; path=/; max-age=31536000; samesite=lax`;
    const segments = pathname.split('/');
    segments[1] = next;
    startTransition(() => router.push(segments.join('/') || `/${next}`));
  }

  return (
    <div
      className="flex rounded-full border border-line-strong p-[3px] text-[13px]"
      role="group"
      aria-label="Language"
    >
      {locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            aria-current={active ? 'true' : undefined}
            disabled={pending}
            className={`t-colors cursor-pointer rounded-full border-0 px-2.5 py-[5px] ${
              active ? 'bg-ink text-white' : 'bg-transparent text-ink'
            }`}
          >
            {localeLabels[code]}
          </button>
        );
      })}
    </div>
  );
}
