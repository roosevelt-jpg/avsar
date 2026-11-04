'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import type { EmployerLandingSlide } from '@/lib/cms/settings';

const DWELL_MS = 6500;

/** Draws one word from the headline in gold italic when accentWord matches. */
function accentTitle(title: string, accentWord: string): ReactNode {
  if (!accentWord || !title) return title;
  const index = title.toLowerCase().indexOf(accentWord.toLowerCase());
  if (index < 0) return title;
  const before = title.slice(0, index);
  const match = title.slice(index, index + accentWord.length);
  const after = title.slice(index + accentWord.length);
  return (
    <>
      {before}
      <em className="accent-italic not-italic" style={{ fontStyle: 'italic', color: '#b28a49' }}>
        {match}
      </em>
      {after}
    </>
  );
}

/**
 * Full-bleed employer hero matching the Portugal Talent Recruitment mockup:
 * photograph behind copy, gold dashed eyebrow, dual CTAs, programme badge.
 */
export function EmployerHero({
  eyebrow,
  headline,
  accentWord,
  intro,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  badgeLabel,
  badgeSubtext,
  badgeHref,
  slides,
}: {
  eyebrow: string;
  headline: string;
  accentWord: string;
  intro: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  badgeLabel: string;
  badgeSubtext: string;
  badgeHref: string;
  slides: EmployerLandingSlide[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const list = slides.length > 0 ? slides : [{ src: '/photos/brand/employer-handshake.jpg', alt: headline }];

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
      aria-label="Employer introduction"
      className="relative min-h-[min(72dvh,760px)] overflow-hidden bg-[#142438] text-white sm:min-h-[min(88vh,760px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
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
            sizes="100vw"
            className="object-cover object-[center_30%]"
          />
        </div>
      ))}

      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(20,36,56,0.90)_0%,rgba(20,36,56,0.74)_40%,rgba(20,36,56,0.38)_68%,rgba(20,36,56,0.22)_100%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-[min(72dvh,760px)] w-full max-w-[1200px] flex-col justify-center px-[clamp(16px,4cqi,56px)] py-[clamp(40px,8cqi,96px)] sm:min-h-[min(88vh,760px)]">
        <div className="max-w-[36rem]">
          {eyebrow ? (
            <p className="m-0 inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">
              <span aria-hidden className="h-px w-7 bg-[var(--color-gold)]" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="display-serif m-0 mt-4 text-balance text-[clamp(28px,5.4cqi,64px)] font-normal leading-[1.08] tracking-[-0.02em]">
            {accentTitle(headline, accentWord)}
          </h1>
          {intro ? <p className="m-0 mt-5 max-w-[42ch] text-[clamp(16px,1.7cqi,19px)] leading-[1.55] text-white/88">{intro}</p> : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={primaryHref}
              className="t-colors inline-flex items-center gap-2 rounded-[10px] bg-[#b28a49] px-5 py-3 text-[14px] font-semibold text-[#142438] no-underline hover:bg-[#c49a58]"
            >
              {primaryLabel}
              <span aria-hidden>→</span>
            </Link>
            {secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="t-colors inline-flex items-center gap-2 rounded-[10px] border border-white/70 bg-[#142438]/35 px-5 py-3 text-[14px] font-semibold text-white no-underline hover:bg-[#142438]/55"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
                </svg>
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>

        {badgeLabel ? (
          <div className="mt-10 self-start lg:absolute lg:bottom-10 lg:end-[clamp(20px,4cqi,56px)] lg:mt-0 lg:self-auto">
            <Link
              href={badgeHref || primaryHref}
              className="inline-flex max-w-[min(100%,22rem)] items-center gap-3 rounded-full bg-white py-2.5 pe-2.5 ps-3.5 text-[#142438] no-underline shadow-[0_12px_32px_rgba(0,0,0,0.22)]"
            >
              <svg viewBox="0 0 24 16" className="h-4 w-6 shrink-0 rounded-[2px]" aria-hidden>
                <rect width="24" height="16" fill="#006600" />
                <rect x="9" width="15" height="16" fill="#FF0000" />
                <circle cx="9" cy="8" r="2.6" fill="#FFCC00" />
              </svg>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight">{badgeLabel}</span>
                {badgeSubtext ? <span className="mt-0.5 block text-[11px] font-medium text-ink-2">{badgeSubtext}</span> : null}
              </span>
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-[#b28a49] text-[13px] font-semibold text-[#142438]"
              >
                →
              </span>
            </Link>
          </div>
        ) : null}

        {list.length > 1 ? (
          <div className="mt-8 flex items-center gap-2 lg:mt-10">
            {list.map((slide, slideIndex) => (
              <button
                key={`${slide.src}-dot-${slideIndex}`}
                type="button"
                aria-label={`Slide ${slideIndex + 1}`}
                aria-current={slideIndex === index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slideIndex === index ? 'w-8 bg-[var(--color-gold)]' : 'w-2.5 bg-white/40'
                }`}
                onClick={() => setIndex(slideIndex)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
