'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { EmployerMark } from '@/lib/employer/marks';

const CARD = 168;
const GAP = 16;
const STRIDE = CARD + GAP;
/** Pixels per second. Slow enough to read a name, steady like a logo crawl. */
const SPEED = 42;

/**
 * The employer names and logos, drifting left the way a logo row does, and
 * stepping one card when the side buttons are used. A short list is repeated
 * until it is wider than the screen: a scroll cannot move a row that already
 * fits. The list is drawn twice so the drift can jump back by half a width
 * without a visible seam. Reduced motion holds the row still; the buttons
 * still step it.
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
  const frame = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const offset = useRef(0);
  const [repeat, setRepeat] = useState(1);

  useEffect(() => {
    const box = frame.current;
    if (!box || employers.length === 0) return;
    const fit = () => {
      const copies = Math.max(1, Math.ceil(box.clientWidth / (employers.length * STRIDE)));
      setRepeat((current) => (current === copies ? current : copies));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [employers.length]);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const half = node.scrollWidth / 2;
      if (half > 0) {
        offset.current += ((now - last) / 1000) * SPEED;
        if (offset.current >= half) offset.current -= half;
        node.style.transform = `translate3d(${-offset.current}px,0,0)`;
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [repeat, employers.length]);

  function place(next: number) {
    const node = track.current;
    if (!node) return;
    const half = node.scrollWidth / 2;
    const value = half > 0 ? ((next % half) + half) % half : 0;
    offset.current = value;
    node.style.transform = `translate3d(${-value}px,0,0)`;
  }

  const cards = (group: number) =>
    employers.map((employer) => (
      <li
        key={`${group}-${employer.id}`}
        aria-hidden={group >= repeat ? true : undefined}
        className="me-4 flex h-[76px] w-[168px] shrink-0 items-center justify-center rounded-[8px] border border-[#0a088f]/10 bg-white px-4 shadow-[0_1px_2px_rgba(10,8,143,0.06)]"
      >
        {employer.logoUrl ? (
          <Image src={employer.logoUrl} alt={group < repeat ? employer.name : ''} width={140} height={40} unoptimized className="max-h-10 w-auto object-contain" />
        ) : (
          <span className="line-clamp-2 text-center text-[14px] font-semibold leading-tight text-[#0a088f]">{employer.name}</span>
        )}
      </li>
    ));

  return (
    <div className="relative">
      <div ref={frame} dir="ltr" className="employer-strip overflow-hidden">
        <ul ref={track} className="m-0 flex w-max list-none p-0">
          {Array.from({ length: repeat * 2 }, (_, group) => cards(group))}
        </ul>
      </div>
      <button
        type="button"
        aria-label={previousLabel}
        className="absolute start-0 top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-[#c96a4b] bg-white text-[#0a088f] shadow-[0_1px_2px_rgba(10,8,143,0.08)] hover:bg-[#0a088f] hover:text-white"
        onClick={() => place(offset.current - STRIDE)}
      >
        <svg viewBox="0 0 24 24" className="size-5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={nextLabel}
        className="absolute end-0 top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-[#c96a4b] bg-white text-[#0a088f] shadow-[0_1px_2px_rgba(10,8,143,0.08)] hover:bg-[#0a088f] hover:text-white"
        onClick={() => place(offset.current + STRIDE)}
      >
        <svg viewBox="0 0 24 24" className="size-5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
