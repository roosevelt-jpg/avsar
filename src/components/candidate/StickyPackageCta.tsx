'use client';

import Link from 'next/link';

/**
 * Fixed bottom bar for assessed, unpaid candidates on a phone. Scrolls them
 * to the package panel (#package) without covering the whole viewport.
 */
export function StickyPackageCta({ href, label }: { href: string; label: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Link
        href={href}
        className="pointer-events-auto t-colors flex w-full items-center justify-center rounded-full bg-ink px-5 py-3.5 text-[15px] font-semibold text-paper no-underline shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-ink-hover"
      >
        {label}
      </Link>
    </div>
  );
}
