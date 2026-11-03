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
      <em className="accent-italic">{match}</em>
      {after}
    </>
  );
}

/**
 * Full-bleed employer hero: slideshow of placement photographs behind the
 * pitch, matching the mockup. Pause on hover or reduced-motion preference.
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
      className="relative min-h-[min(88vh,760px)] overflow-hidden bg-[#0a088f] text-white"
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

      {/* Soft navy veil so the white type stays readable on bright slides. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(10,8,143,0.88)_0%,rgba(10,8,143,0.72)_42%,rgba(10,8,143,0.35)_70%,rgba(10,8,143,0.2)_100%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-[min(88vh,760px)] w-full max-w-[1200px] flex-col justify-center px-[clamp(20px,4cqi,56px)] py-[clamp(56px,8cqi,96px)]">
        <div className="max-w-[34rem]">
          {eyebrow ? (
            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">{eyebrow}</p>
          ) : null}
          <h1 className="display-serif m-0 mt-4 text-balance text-[clamp(36px,5.4cqi,64px)] font-normal leading-[1.08] tracking-[-0.02em]">
            {accentTitle(headline, accentWord)}
          </h1>
          {intro ? <p className="m-0 mt-5 max-w-[40ch] text-[clamp(16px,1.7cqi,19px)] leading-[1.55] text-white/88">{intro}</p> : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={primaryHref} className="btn-gradient t-colors inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold no-underline">
              {primaryLabel}
              <span aria-hidden>→</span>
            </Link>
            {secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="btn-outline-light t-colors inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold no-underline"
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
            {badgeHref ? (
              <Link
                href={badgeHref}
                className="inline-flex max-w-[min(100%,28rem)] items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0a088f] no-underline shadow-[0_12px_32px_rgba(0,0,0,0.22)]"
              >
                <span aria-hidden className="text-[18px] leading-none">
                  🇵🇹
                </span>
                <span>{badgeLabel}</span>
                <span aria-hidden className="text-[var(--color-gold)]">
                  →
                </span>
              </Link>
            ) : (
              <span className="inline-flex max-w-[min(100%,28rem)] items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0a088f] shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
                <span aria-hidden className="text-[18px] leading-none">
                  🇵🇹
                </span>
                {badgeLabel}
              </span>
            )}
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
