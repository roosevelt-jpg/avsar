'use client';

import { useEffect } from 'react';

/** Once after assessment completion (?offer=1), bring the package offer into view. */
export function OfferScroll({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const el = document.getElementById('package-offer');
    if (!el) return;
    const id = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => window.clearTimeout(id);
  }, [active]);
  return null;
}
