'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { barePath } from '@/lib/i18n/path';

/**
 * The shopfront menu marks the page you are on and draws the underline as
 * you move across it. A static list of links does not tell you where you
 * landed, which is the whole job of a navigation bar.
 */
export function MarketNav({
  items,
  className,
  linkClassName,
}: {
  items: { href: string; label: string }[];
  className: string;
  linkClassName: string;
}) {
  const bare = barePath(usePathname() ?? '/').replace(/\/$/, '') || '/';

  return (
    <nav aria-label="Main" className={className}>
      {items.map((item) => {
        const target = item.href.replace(/\/$/, '') || '/';
        const current = target === '/' ? bare === '/' : bare === target || bare.startsWith(`${target}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={`group relative ${linkClassName} ${current ? 'text-ink' : 'text-ink-2'}`}
          >
            {item.label}
            <span
              aria-hidden
              className={`absolute inset-x-0 -bottom-1.5 h-[2px] origin-left rounded-full bg-[linear-gradient(90deg,#16324f,#3c8fd4_70%,#c4a574)] transition-transform duration-300 ${
                current ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
