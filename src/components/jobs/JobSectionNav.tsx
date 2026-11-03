'use client';

import { useEffect, useState } from 'react';

type Item = { id: string; label: string };

/**
 * Sticky in-page nav for the job detail mockup. Anchors only — no fake tabs
 * that hide live content. Highlights the section currently in view.
 */
export function JobSectionNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    if (items.length === 0) return;
    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-[72px] z-20 -mx-1 overflow-x-auto px-1 py-2"
    >
      <ul className="m-0 flex list-none gap-2 rounded-[14px] border border-line bg-white p-1.5 shadow-[0_12px_32px_-20px_rgba(10,8,143,0.45)]">
        {items.map((item) => {
          const on = item.id === active;
          return (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                className={`inline-flex items-center rounded-[10px] px-3.5 py-2 text-[13px] font-semibold no-underline transition-colors ${
                  on ? 'bg-[var(--color-gold)] text-[#0a088f]' : 'text-ink-2 hover:bg-ivory'
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
