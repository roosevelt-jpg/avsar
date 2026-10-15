'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { SECTOR_SLUGS, sectorLabel, type SectorSlug } from '@/lib/data/sectors';

const MIN_ENGLISH = ['A2', 'B1', 'B2'] as const;

/**
 * Query box and filter chips. Filters live in the URL so a search is
 * shareable, survives a reload and can be bookmarked by a recruiter.
 */
export function SearchControls({
  query,
  sector,
  minEnglish,
}: {
  query: string;
  sector?: SectorSlug;
  minEnglish: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(query);
  const [pending, startTransition] = useTransition();

  function apply(next: Record<string, string | undefined>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, item] of Object.entries(next)) {
      if (item === undefined || item === '') search.delete(key);
      else search.set(key, item);
    }
    search.delete('page');
    startTransition(() => router.push(`/admin?${search.toString()}`));
  }

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply({ q: value });
        }}
        className="flex flex-wrap items-center gap-2.5"
      >
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[12px] border border-line-strong bg-surface px-3.5 focus-within:border-employer t-colors">
          <span aria-hidden className="text-[16px] text-muted">
            ⌕
          </span>
          <label className="sr-only-focusable" htmlFor="talent-q">
            Search the talent pool
          </label>
          <input
            id="talent-q"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-full border-0 bg-transparent py-3 text-[15px] outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="t-colors cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-hover disabled:opacity-60"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip label="All sectors" active={!sector} onClick={() => apply({ sector: undefined })} />
        {SECTOR_SLUGS.map((slug) => (
          <Chip
            key={slug}
            label={sectorLabel(slug)}
            active={sector === slug}
            onClick={() => apply({ sector: slug })}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {MIN_ENGLISH.map((level) => (
          <Chip
            key={level}
            label={`English ${level}+`}
            active={minEnglish === level}
            onClick={() => apply({ minEnglish: level })}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="t-colors cursor-pointer rounded-full border px-3.5 py-2 text-[13px]"
      style={{
        borderColor: active ? 'var(--color-ink)' : 'var(--color-line-strong)',
        background: active ? 'var(--color-ink)' : 'var(--color-surface)',
        color: active ? 'var(--color-paper)' : 'var(--color-ink)',
      }}
    >
      {label}
    </button>
  );
}
