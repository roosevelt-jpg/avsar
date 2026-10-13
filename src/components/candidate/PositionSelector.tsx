'use client';

import { formatIndicative } from '@/lib/data/brand';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Mono } from '@/components/ui/Mono';
import { AREAS, POSITIONS, positionsInArea } from '@/lib/data/positions';
import { fill, type Dictionary, type Locale } from '@/lib/i18n';

/**
 * Position picker in the hero.
 *
 * Grouped by area, because twelve unsorted chips is a wall. The candidate picks
 * a position rather than an area: that is what they call themselves, and it is
 * what decides which assessment they get.
 */
export function PositionSelector({
  locale,
  t,
  initial,
}: {
  locale: Locale;
  t: Dictionary;
  initial?: string;
}) {
  const [selected, setSelected] = useState(initial ?? POSITIONS[0].slug);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const start = () =>
    startTransition(() => router.push(`/${locale}/signup?position=${selected}`));

  return (
    <div className="w-full max-w-[760px] rounded-[20px] border border-line bg-surface p-[clamp(18px,2.4cqi,26px)] text-left shadow-[0_1px_0_#e4e0d6,0_24px_48px_-28px_rgba(27,26,23,.25)]">
      <p className="m-0 mb-4 text-[15px] text-ink-2">{t.askWork}</p>

      <div className="flex flex-col gap-4" role="radiogroup" aria-label={t.askWork}>
        {AREAS.map((area) => {
          const positions = positionsInArea(area.slug);
          if (positions.length === 0) return null;
          return (
            <div key={area.slug}>
              <Mono className="mb-2 block text-muted">{area.label.toUpperCase()}</Mono>
              <div className="flex flex-wrap gap-2">
                {positions.map((position) => {
                  const index = POSITIONS.findIndex((item) => item.slug === position.slug);
                  const active = selected === position.slug;
                  return (
                    <button
                      key={position.slug}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelected(position.slug)}
                      className={`t-colors cursor-pointer rounded-full border px-[14px] py-2 text-[14px] ${
                        active
                          ? 'border-ink bg-ink text-white'
                          : 'border-line-strong bg-surface text-ink hover:border-ink'
                      }`}
                    >
                      {t.sectors[index] ?? position.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-[18px]">
        <Mono className="text-muted">
          {fill(t.heroMeta, { price: formatIndicative() })}
        </Mono>
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
