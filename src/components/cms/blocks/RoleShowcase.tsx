'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const DWELL_MS = 4500;

export type RoleSlide = {
  slug: string;
  label: string;
  href: string;
  image: string;
  blur: string;
};

export type RoleArea = {
  slug: string;
  label: string;
  roles: RoleSlide[];
};

/**
 * The areas are the tabs and the roles under a tab are the links, the same
 * list the jobs board and the job form use. The photograph moves through
 * that list on its own. A click on a tab jumps there; the movement then
 * carries on, because this section is a tour of the work rather than a
 * menu that waits.
 */
export function RoleShowcase({
  areas,
  intro,
  label,
  previousLabel,
  nextLabel,
}: {
  areas: RoleArea[];
  intro: string;
  label: string;
  previousLabel: string;
  nextLabel: string;
}) {
  const slides = areas.flatMap((area, areaIndex) => area.roles.map((role) => ({ areaIndex, role })));
  const [cursor, setCursor] = useState(0);
  const [instant, setInstant] = useState(false);
  const [reduce, setReduce] = useState(false);
  const cursorRef = useRef(0);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduce(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reduce || slides.length < 2) return;
    const timer = window.setInterval(() => {
      const current = cursorRef.current;
      const next = (current + 1) % slides.length;
      /* The track cannot slide from the last frame back to the first without
         travelling the whole way in reverse, so that one step cuts. */
      if (next < current) setInstant(true);
      setCursor(next);
    }, DWELL_MS);
    return () => window.clearInterval(timer);
  }, [reduce, slides.length]);

  useEffect(() => {
    if (!instant) return;
    const timer = window.setTimeout(() => setInstant(false), 60);
    return () => window.clearTimeout(timer);
  }, [instant, cursor]);

  const current = slides[cursor];
  if (!current) return null;
  const area = areas[current.areaIndex];
  if (!area) return null;

  function goTo(next: number) {
    if (slides.length === 0) return;
    const wrapped = (next % slides.length + slides.length) % slides.length;
    const distance = Math.abs(wrapped - cursor);
    const hop = Math.min(distance, slides.length - distance);
    const wraps = (cursor === slides.length - 1 && wrapped === 0) || (cursor === 0 && wrapped === slides.length - 1);
    if (!reduce && (wraps || hop > 1)) setInstant(true);
    setCursor(wrapped);
  }

  function chooseArea(index: number) {
    const start = slides.findIndex((slide) => slide.areaIndex === index);
    if (start >= 0) goTo(start);
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-x-8 gap-y-2 overflow-x-auto border-b border-[#16324f]/15">
        {areas.map((item, index) => {
          const selected = index === current.areaIndex;
          return (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`-mb-px shrink-0 cursor-pointer border-b-[3px] bg-transparent pb-3 text-[16px] font-semibold whitespace-nowrap ${
                selected ? 'border-[#c96a4b] text-[#16324f]' : 'border-transparent text-[#3d5168] hover:text-[#16324f]'
              }`}
              onClick={() => chooseArea(index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 items-start gap-[clamp(28px,5cqi,64px)] lg:grid-cols-2">
        <div>
          {intro ? <p className="m-0 max-w-[46ch] text-[16px] leading-[1.6] text-[#3d5168]">{intro}</p> : null}
          <ul className="m-0 mt-7 grid list-none grid-cols-1 gap-x-8 gap-y-3 p-0 sm:grid-cols-2">
            {area.roles.map((role) => {
              const active = role.slug === current.role.slug;
              return (
                <li key={role.slug}>
                  <Link
                    href={role.href}
                    aria-current={active ? 'true' : undefined}
                    className={`text-[16px] font-medium no-underline ${active ? 'text-[#c96a4b]' : 'text-[#16324f] hover:text-[#c96a4b]'}`}
                  >
                    {role.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[12px] bg-[#16324f]" dir="ltr">
            <div
              className={`flex ${instant || reduce ? '' : 'transition-transform duration-700 ease-out'}`}
              style={{ width: `${slides.length * 100}%`, transform: `translateX(-${(cursor * 100) / slides.length}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={slide.role.slug} className="relative aspect-[4/3] shrink-0" style={{ width: `${100 / slides.length}%` }}>
                  <Image
                    src={slide.role.image}
                    alt={index === cursor ? slide.role.label : ''}
                    fill
                    sizes="(max-width: 1024px) 100vw, 46vw"
                    placeholder="blur"
                    blurDataURL={slide.role.blur}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          {slides.length > 1 ? (
            <div className="absolute bottom-3 end-3 flex gap-2">
              <button
                type="button"
                aria-label={previousLabel}
                className="grid size-10 cursor-pointer place-items-center rounded-full border border-[#c96a4b] bg-white text-[#16324f] hover:bg-[#16324f] hover:text-white"
                onClick={() => goTo(cursor - 1)}
              >
                <svg viewBox="0 0 24 24" className="size-5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                  <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label={nextLabel}
                className="grid size-10 cursor-pointer place-items-center rounded-full border border-[#c96a4b] bg-white text-[#16324f] hover:bg-[#16324f] hover:text-white"
                onClick={() => goTo(cursor + 1)}
              >
                <svg viewBox="0 0 24 24" className="size-5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
