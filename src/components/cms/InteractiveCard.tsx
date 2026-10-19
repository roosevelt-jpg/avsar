'use client';

import { useRef, type ReactNode } from 'react';

/**
 * A card that tilts towards the pointer and carries a soft spotlight under it.
 *
 * The pointer position is written straight to CSS custom properties on the
 * element (--mx, --my, --rx, --ry), so moving the mouse never re-renders
 * React. Touch screens and visitors who ask for reduced motion get the plain
 * card: the handlers bail out before writing anything.
 *
 * Put scroll-in animations on a wrapper, not on this element: they also set
 * `transform`, and would hold the tilt at zero.
 */
export function InteractiveCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function move(event: React.PointerEvent<HTMLDivElement>) {
    const card = ref.current;
    if (!card || event.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    /* Up to 7 degrees each way: enough to feel physical, not enough to make
       the text hard to read mid-tilt. */
    card.style.setProperty('--rx', `${((0.5 - y) * 14).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`);
  }

  function leave() {
    const card = ref.current;
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  }

  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`interactive-card ${className}`}>
      {children}
    </div>
  );
}
