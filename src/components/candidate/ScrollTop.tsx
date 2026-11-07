'use client';

import { useSyncExternalStore } from 'react';

function subscribeScroll(onStoreChange: () => void) {
  window.addEventListener('scroll', onStoreChange, { passive: true });
  return () => window.removeEventListener('scroll', onStoreChange);
}

/** Small scroll-to-top control near the bottom-right WhatsApp desk. */
export function ScrollTop() {
  const visible = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 320,
    () => false,
  );

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed right-4 bottom-[5.75rem] z-40 grid size-11 cursor-pointer place-items-center rounded-full border border-[#142438]/15 bg-white text-[#142438] shadow-[0_10px_28px_rgba(20,36,56,0.18)] transition-opacity duration-300 hover:border-[#b28a49] ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <span aria-hidden className="text-[18px] leading-none">
        ↑
      </span>
    </button>
  );
}
