'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { localHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';

function subscribeScroll(onStoreChange: () => void) {
  window.addEventListener('scroll', onStoreChange, { passive: true });
  return () => window.removeEventListener('scroll', onStoreChange);
}

/**
 * Left-edge assessment tab after scroll — same chrome rhythm as Enquire on
 * the right, but a direct link to /assessment. Navy over gold so the mark
 * reads as two brand colours; white type for contrast on both halves.
 */
export function AssessmentDrawer({ locale }: { locale: Locale }) {
  const visible = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 280,
    () => false,
  );

  return (
    <Link
      href={localHref(locale, '/assessment')}
      aria-label="Start your assessment now"
      className={`fixed top-1/2 left-0 z-40 -translate-y-1/2 rounded-r-[8px] px-2.5 py-4 text-[13px] font-semibold tracking-[0.08em] text-white no-underline shadow-[0_8px_24px_rgba(20,36,56,0.25)] transition-opacity duration-300 hover:brightness-110 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{
        background: 'linear-gradient(180deg, #142438 0%, #142438 50%, #b28a49 50%, #b28a49 100%)',
      }}
    >
      {/* Same bottom → top reading as Enquire; chrome stays unrotated. */}
      <span className="inline-block rotate-180 [writing-mode:vertical-lr] [text-orientation:mixed]">
        Start your Assessment Now
      </span>
    </Link>
  );
}
