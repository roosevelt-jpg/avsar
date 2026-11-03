'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/cms/primitives';
import type { EmployerRegHighlight, EmployerRegSlide } from '@/lib/cms/employer-registration';

const DWELL_MS = 6500;

/** Full-bleed / split hero for /employers/register with a conversion slideshow. */
export function EmployerRegisterHero({
  eyebrow,
  headline,
  intro,
  slides,
  highlights,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  slides: EmployerRegSlide[];
  highlights: EmployerRegHighlight[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const list = slides.length > 0 ? slides : [{ src: '/photos/brand/employer-register-hero.jpg', alt: headline }];

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduce(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (paused || reduce || list.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % list.length), DWELL_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduce, list.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Employer registration"
      className="relative overflow-hidden bg-[#0a088f] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto grid min-h-[min(70vh,620px)] w-full max-w-[1280px] grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="relative z-10 flex flex-col justify-center px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,72px)]">
          {eyebrow ? (
            <p className="m-0 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">
              <span aria-hidden className="h-px w-6 bg-[var(--color-gold)]" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="display-serif m-0 mt-4 text-balance text-[clamp(32px,4.8cqi,56px)] font-normal leading-[1.08]">
            {headline}
          </h1>
          {intro ? <p className="m-0 mt-5 max-w-[42ch] text-[clamp(15px,1.6cqi,18px)] leading-[1.55] text-white/88">{intro}</p> : null}

          {highlights.length > 0 ? (
            <ul className="m-0 mt-10 flex list-none flex-wrap gap-x-8 gap-y-5 p-0">
              {highlights.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-[13px] font-medium text-white/95">
                  <span className="grid size-9 place-items-center rounded-full border border-[var(--color-gold)]/55 text-[var(--color-gold)]">
                    <Icon name={item.icon} className="size-4" />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          ) : null}

          {list.length > 1 ? (
            <div className="mt-8 flex items-center gap-2 lg:hidden">
              {list.map((slide, slideIndex) => (
                <button
                  key={`${slide.src}-m-${slideIndex}`}
                  type="button"
                  aria-label={`Slide ${slideIndex + 1}`}
                  className={`h-1.5 rounded-full transition-all ${slideIndex === index ? 'w-8 bg-[var(--color-gold)]' : 'w-2.5 bg-white/35'}`}
                  onClick={() => setIndex(slideIndex)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[240px] bg-[#1614a8] lg:min-h-full">
          {list.map((slide, slideIndex) => (
            <div
              key={`${slide.src}-${slideIndex}`}
              className={`absolute inset-0 transition-opacity duration-1000 ${slideIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              aria-hidden={slideIndex !== index}
            >
              <Image
                src={slide.src}
                alt={slideIndex === index ? slide.alt : ''}
                fill
                priority={slideIndex === 0}
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover"
              />
            </div>
          ))}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-[#0a088f] to-transparent max-lg:hidden" />
          {list.length > 1 ? (
            <div className="absolute bottom-5 end-5 hidden items-center gap-2 lg:flex">
              {list.map((slide, slideIndex) => (
                <button
                  key={`${slide.src}-d-${slideIndex}`}
                  type="button"
                  aria-label={`Slide ${slideIndex + 1}`}
                  className={`h-1.5 rounded-full transition-all ${slideIndex === index ? 'w-8 bg-[var(--color-gold)]' : 'w-2.5 bg-white/50'}`}
                  onClick={() => setIndex(slideIndex)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
