'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/cms/primitives';
import type { EmployerRegHighlight, EmployerRegSlide } from '@/lib/cms/employer-registration';

const DWELL_MS = 6500;

/**
 * Full-bleed overlay hero for /employers/register — matches the registration
 * mockup: photograph behind copy, gold eyebrow, three highlight checks with
 * icon above label. Auto-advances when Settings provides more than one slide.
 */
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
  const list =
    slides.length > 0
      ? slides
      : [{ src: '/photos/brand/employer-register-hero.jpg', alt: headline }];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduce(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (paused || reduce || list.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % list.length);
    }, DWELL_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduce, list.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Employer registration"
      className="relative isolate min-h-[min(68vh,620px)] overflow-hidden bg-[#142438] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {list.map((slide, slideIndex) => (
        <div
          key={`${slide.src}-${slideIndex}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            slideIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={slideIndex !== index}
        >
          <Image
            src={slide.src}
            alt={slideIndex === index ? slide.alt : ''}
            fill
            priority={slideIndex === 0}
            sizes="100vw"
            className="object-cover object-[center_28%]"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-[#142438]/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#142438]/94 via-[#142438]/78 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col justify-center px-[clamp(20px,4cqi,56px)] py-[clamp(56px,9cqi,108px)]">
        <div className="max-w-[640px]">
          {eyebrow ? (
            <p className="m-0 inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">
              <span aria-hidden className="h-px w-7 bg-[var(--color-gold)]" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="display-serif m-0 mt-4 text-balance text-[clamp(34px,5.2cqi,56px)] font-normal leading-[1.08]">
            {headline}
          </h1>
          {intro ? (
            <p className="m-0 mt-5 max-w-[50ch] text-[clamp(15px,1.6cqi,18px)] leading-[1.55] text-white/90">{intro}</p>
          ) : null}

          {highlights.length > 0 ? (
            <ul className="m-0 mt-10 flex list-none flex-wrap gap-x-10 gap-y-5 p-0">
              {highlights.map((item) => (
                <li key={item.label} className="flex max-w-[11rem] flex-col items-start gap-2.5">
                  <span className="grid size-10 place-items-center text-[var(--color-gold)]">
                    <Icon name={item.icon} className="size-7" />
                  </span>
                  <span className="text-[13px] font-medium leading-[1.35] text-white/95">{item.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
