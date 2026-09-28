'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Mono } from '@/components/ui/Mono';
import { SECTOR_SLUGS } from '@/lib/data/sectors';
import type { Dictionary, Locale } from '@/lib/i18n';

/**
 * The hero's search-box-style sector picker.
 *
 * Single select. The choice is carried into sign-up step 2 through the query
 * string, which is what the handoff means by the selection being shared between
 * the two screens: it survives a refresh and can be linked to directly.
 */
export function SectorSelector({
  locale,
  t,
  initialSector = 0,
}: {
  locale: Locale;
  t: Dictionary;
  initialSector?: number;
}) {
  const [selected, setSelected] = useState(initialSector);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const start = () => {
    const slug = SECTOR_SLUGS[selected] ?? SECTOR_SLUGS[0];
    startTransition(() => router.push(`/${locale}/signup?sector=${slug}`));
  };

  return (
    <div className="w-full max-w-[720px] rounded-[20px] border border-line bg-surface p-[clamp(18px,2.4cqi,26px)] text-left shadow-[0_1px_0_#e4e0d6,0_24px_48px_-28px_rgba(27,26,23,.25)]">
      <p className="m-0 mb-3.5 text-[15px] text-ink-2">{t.askWork}</p>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.askWork}>
        {t.sectors.map((label, index) => {
          const active = selected === index;
          return (
            <button
              key={SECTOR_SLUGS[index]}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(index)}
              className={`t-colors cursor-pointer rounded-full border px-[14px] py-2 text-[14px] ${
                active
                  ? 'border-ink bg-ink text-white'
                  : 'border-line-strong bg-surface text-ink hover:border-ink'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-[18px]">
        <Mono className="text-muted">{t.heroMeta}</Mono>
        <button
          type="button"
          onClick={start}
          disabled={pending}
          className="t-colors cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-white hover:bg-accent disabled:opacity-60"
        >
          {t.cta} →
        </button>
      </div>
    </div>
  );
}
