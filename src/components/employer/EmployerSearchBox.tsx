'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { DEFAULT_EMPLOYER_QUERY, EXAMPLE_QUERIES } from '@/lib/data/candidates';

/**
 * Plain-language search on the employer landing page. Hands the query to the
 * admin talent search, which is where the parsing and results live.
 */
export function EmployerSearchBox() {
  const [query, setQuery] = useState(DEFAULT_EMPLOYER_QUERY);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const search = (value: string) =>
    startTransition(() => router.push(`/admin?q=${encodeURIComponent(value)}`));

  return (
    <div className="w-full max-w-[720px]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          search(query);
        }}
        className="flex flex-wrap items-center gap-2.5 rounded-[20px] border border-line bg-surface p-3 shadow-[0_1px_0_#e4e0d6,0_24px_48px_-28px_rgba(27,26,23,.25)]"
      >
        <label className="sr-only-focusable" htmlFor="employer-q">
          Describe the role you need to fill
        </label>
        <input
          id="employer-q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="12 housekeepers for a Dubai hotel, English B1+, start in March"
          className="min-w-[200px] flex-1 border-0 bg-transparent px-2.5 py-2.5 text-[15px] outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="t-colors cursor-pointer rounded-[12px] border-0 bg-employer px-5 py-3 text-[15px] font-medium text-white hover:bg-employer-deep disabled:opacity-60"
        >
          Search talent pool
        </button>
      </form>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setQuery(example);
              search(example);
            }}
            className="t-colors cursor-pointer rounded-full border border-line-strong bg-surface px-3.5 py-2 text-[13px] text-ink-2 hover:border-employer hover:text-employer"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
