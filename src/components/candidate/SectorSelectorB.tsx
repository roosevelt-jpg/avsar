'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { SECTOR_SLUGS } from '@/lib/data/sectors';
import type { Dictionary, Locale } from '@/lib/i18n';

/** Direction B's white selector card. Same behaviour as A, different skin. */
export function SectorSelectorB({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="w-full p-[clamp(20px,2.6cqi,30px)]"
      style={{ background: '#fff', border: '1px solid var(--b-line)', borderRadius: 'var(--b-radius)' }}
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="m-0 text-[15px]" style={{ color: 'var(--b-body)' }}>
          {t.askWork}
        </p>
        <span className="font-mono text-[12px]" style={{ color: 'var(--b-muted)' }}>
          1/3
        </span>
      </div>

      <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={t.askWork}>
        {t.sectors.map((label, index) => {
          const active = selected === index;
          return (
            <button
              key={SECTOR_SLUGS[index]}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(index)}
              className="t-colors cursor-pointer px-4 py-3 text-left text-[15px]"
              style={{
                border: `1px solid ${active ? 'var(--b-azulejo)' : 'var(--b-line)'}`,
                background: active ? 'var(--b-tint)' : '#fff',
                color: 'var(--b-ink)',
                borderRadius: 'var(--b-radius)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() =>
            router.push(`/${locale}/signup?sector=${SECTOR_SLUGS[selected] ?? SECTOR_SLUGS[0]}`),
          )
        }
        className="t-colors mt-5 w-full cursor-pointer border-0 px-5 py-3.5 text-[15px] font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--b-azulejo)', borderRadius: 'var(--b-radius)' }}
      >
        {t.cta} →
      </button>

      <p className="mt-4 mb-0 text-[12px] leading-[1.55]" style={{ color: 'var(--b-muted)' }}>
        {t.fine}
      </p>
    </div>
  );
}
