'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { EmployerMark } from '@/lib/employer/marks';

const CARD = 168;
const GAP = 16;

/**
 * The employer names and logos, drifting left the way a logo row does, and
 * stepping one card when the side buttons are used. The list is drawn twice
 * so the drift can jump back by half a width without a visible seam.
 * Reduced motion holds the row still; the buttons still step it.
 */
export function EmployerStrip({
  employers,
  previousLabel,
  nextLabel,
}: {
  employers: EmployerMark[];
  previousLabel: string;
  nextLabel: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const half = node.scrollWidth / 2;
      if (half > 0) {
        node.scrollLeft += ((now - last) / 1000) * 42;
        if (node.scrollLeft >= half) node.scrollLeft -= half;
      }
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [employers.length]);

  function nudge(direction: number) {
    const node = scroller.current;
    if (!node) return;
    const half = node.scrollWidth / 2;
    node.scrollLeft += direction * (CARD + GAP);
    if (half > 0 && node.scrollLeft >= half) node.scrollLeft -= half;
    if (node.scrollLeft < 0) node.scrollLeft += half;
  }

  const cards = (copy: number) =>
    employers.map((employer) => (
      <li
        key={`${copy}-${employer.id}`}
        aria-hidden={copy === 1 ? true : undefined}
        className="flex h-[76px] w-[168px] shrink-0 items-center justify-center rounded-[8px] border border-[#16324f]/10 bg-white px-4 shadow-[0_1px_2px_rgba(22,50,79,0.06)]"
      >
        {employer.logoUrl ? (
          <Image src={employer.logoUrl} alt={copy === 0 ? employer.name : ''} width={140} height={40} unoptimized className="max-h-10 w-auto object-contain" />
        ) : (
          <span className="line-clamp-2 text-center text-[14px] font-semibold leading-tight text-[#16324f]">{employer.name}</span>
        )}
      </li>
    ));

  return (
    <div className="relative">
      <div ref={scroller} dir="ltr" className="employer-strip overflow-x-auto">
        <ul className="m-0 flex w-max list-none gap-4 p-0">
          {cards(0)}
          {cards(1)}
        </ul>
      </div>
      <button
        type="button"
        aria-label={previousLabel}
        className="absolute start-0 top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-[#c96a4b] bg-white text-[#16324f] shadow-[0_1px_2px_rgba(22,50,79,0.08)] hover:bg-[#16324f] hover:text-white"
        onClick={() => nudge(-1)}
      >
        <svg viewBox="0 0 24 24" className="size-5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={nextLabel}
        className="absolute end-0 top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-[#c96a4b] bg-white text-[#16324f] shadow-[0_1px_2px_rgba(22,50,79,0.08)] hover:bg-[#16324f] hover:text-white"
        onClick={() => nudge(1)}
      >
        <svg viewBox="0 0 24 24" className="size-5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
