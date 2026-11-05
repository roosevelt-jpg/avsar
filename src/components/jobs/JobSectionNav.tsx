'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/cms/primitives';

type Item = { id: string; label: string; icon?: string };

const ICONS: Record<string, string> = {
  overview: 'document',
  company: 'briefcase',
  benefits: 'heart',
  requirements: 'check',
  location: 'map',
  apply: 'users',
};

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
    <nav aria-label="On this page" className="shop-sticky sticky z-20 -mx-1 overflow-x-auto px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="m-0 flex w-max min-w-full list-none gap-1.5 rounded-[12px] border border-[#142438]/10 bg-white p-1.5 pe-3 shadow-[0_14px_36px_-22px_rgba(20,36,56,0.4)]">
        {items.map((item) => {
          const on = item.id === active;
          const icon = item.icon || ICONS[item.id] || 'check';
          return (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                className={`inline-flex items-center gap-2 rounded-[8px] px-3.5 py-2.5 text-[13px] font-semibold no-underline transition-colors ${
                  on
                    ? 'bg-[var(--color-gold)] text-[#142438]'
                    : 'text-ink-2 hover:bg-[#f4f5f7]'
                }`}
              >
                <Icon name={icon} className={`size-3.5 ${on ? 'text-[#142438]' : 'text-[var(--color-gold)]'}`} />
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
