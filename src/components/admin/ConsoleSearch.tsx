'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type SearchPage = { href: string; label: string; group: string };
export type SearchTarget = { label: string; base: string };

type Option = { key: string; label: string; hint: string; href: string; detail?: string };
type Hit = { kind: string; id: string; title: string; detail: string; href: string };

const KIND_LABELS: Record<string, string> = {
  candidate: 'Candidate',
  application: 'Application',
  job: 'Job',
  employer: 'Employer',
  lead: 'CRM lead',
  staff: 'Staff',
  payment: 'Payment',
};

/**
 * The search box in the console header. It jumps to any page in the person's
 * navigation, which the server has already filtered by permission, and hands
 * free text to the searches they may run (talent, applications). It never
 * queries anything itself, so it cannot show what the pages behind it would
 * refuse.
 */
export function ConsoleSearch({ pages, targets, live = false }: { pages: SearchPage[]; targets: SearchTarget[]; live?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [hits, setHits] = useState<{ q: string; items: Hit[] }>({ q: '', items: [] });
  const [loading, setLoading] = useState(false);

  /* Records from the database, for staff. A short pause after typing, and the
     previous request is abandoned, so a fast typist sends one query, not ten. */
  useEffect(() => {
    const text = query.trim();
    if (!live || text.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(text)}`, { signal: controller.signal, cache: 'no-store' });
        if (response.ok) {
          const body = (await response.json()) as { hits?: Hit[] };
          setHits({ q: text, items: body.hits ?? [] });
        }
      } catch {
        /* Aborted by the next keystroke, or offline: keep what is shown. */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, live]);

  const options = useMemo<Option[]>(() => {
    const text = query.trim();
    if (!text) return [];
    const needle = text.toLowerCase();
    const records = hits.q === text ? hits.items.map((hit) => ({ key: `${hit.kind}:${hit.id}`, label: hit.title, detail: hit.detail, hint: KIND_LABELS[hit.kind] ?? hit.kind, href: hit.href })) : [];
    const matches = pages
      .filter((page) => page.label.toLowerCase().includes(needle) || page.group.toLowerCase().includes(needle))
      .slice(0, 4)
      .map((page) => ({ key: page.href, label: page.label, hint: page.group, href: page.href }));
    const searches = targets.map((target) => ({
      key: target.base,
      label: `${target.label} for “${text}”`,
      hint: 'Search',
      href: `${target.base}${encodeURIComponent(text)}`,
    }));
    return [...records, ...matches, ...searches];
  }, [query, pages, targets, hits]);

  /* "/" or Ctrl/Cmd+K from anywhere in the console, unless the person is
     already typing in a field. */
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function go(option: Option | undefined) {
    if (!option) return;
    setOpen(false);
    setQuery('');
    input.current?.blur();
    router.push(option.href);
  }

  const showList = open && options.length > 0;

  return (
    <div className="relative w-full max-w-[420px]">
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" strokeLinecap="round" />
      </svg>
      <input
        ref={input}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${active}` : undefined}
        aria-label="Search the console"
        placeholder={live ? 'Search people, applications, jobs, leads, payments' : 'Search pages and talent'}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, options.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          } else if (event.key === 'Enter') {
            event.preventDefault();
            go(options[active]);
          } else if (event.key === 'Escape') {
            setOpen(false);
            input.current?.blur();
          }
        }}
        className="h-10 w-full rounded-full border border-line bg-canvas/60 ps-10 pe-12 text-[14px] text-ink outline-none placeholder:text-muted focus:border-ink focus:bg-surface [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 rounded-[6px] border border-line bg-surface px-1.5 font-mono text-[11px] text-muted sm:block">/</kbd>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-busy={loading}
          className="absolute inset-x-0 top-12 z-50 m-0 max-h-[70vh] list-none overflow-y-auto rounded-[16px] border border-line bg-surface p-1.5 shadow-[0_24px_60px_-24px_rgba(27,26,23,0.4)]"
        >
          {options.map((option, index) => (
            <li
              key={option.key}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                go(option);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-[14px] ${index === active ? 'bg-canvas/70 text-ink' : 'text-ink-2'}`}
            >
              <span className="min-w-0">
                <span className="block truncate">{option.label}</span>
                {option.detail ? <span className="block truncate text-[12px] text-muted">{option.detail}</span> : null}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-muted">{option.hint}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
