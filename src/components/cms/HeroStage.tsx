'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

export type HeroSlide = {
  kind: 'image' | 'video';
  src: string;
  poster?: string;
  alt: string;
  caption: string;
};

const DWELL_MS = 6500;

/**
 * The homepage opener. The film or photograph sits flat beside the words.
 * Hover, a pause control, or a reduced-motion setting holds the current frame.
 * The brand variant paints a full-bleed navy band for the mockup hero.
 */
export function HeroStage({
  slides,
  lead,
  children,
  variant = 'default',
  badge,
}: {
  slides: HeroSlide[];
  lead?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'brand';
  badge?: { label: string; href?: string } | null;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [broken, setBroken] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduce(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (paused || reduce || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, DWELL_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduce, slides.length]);

  const count = slides.length;
  const go = (next: number) => setIndex((next + count) % count);
  const current = slides[index];
  const brand = variant === 'brand';

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Introduction"
      className={
        brand
          ? 'hero-brand relative overflow-hidden bg-[#0a088f] px-[clamp(20px,4cqi,56px)] pt-[clamp(36px,5cqi,64px)] pb-[clamp(36px,5cqi,64px)] text-white'
          : 'relative px-[clamp(20px,4cqi,56px)] pt-[clamp(28px,4cqi,56px)] pb-[clamp(28px,4cqi,56px)]'
      }
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative mx-auto w-full max-w-[1200px]">
        {lead && !brand ? <div className="mb-4">{lead}</div> : null}
        <div
          className={`grid grid-cols-1 items-center gap-[clamp(28px,4cqi,56px)] ${
            brand ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]' : 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-start'
          }`}
        >
          <div className="min-w-0">
            {lead && brand ? <div className="mb-4">{lead}</div> : null}
            {children}
          </div>

          {current ? (
            <div className="relative">
              <div
                className={`relative overflow-hidden bg-[#1614a8] ${
                  brand
                    ? 'aspect-[4/5] rounded-[18px] shadow-[0_24px_48px_rgba(0,0,0,0.28)] sm:aspect-[5/4] lg:aspect-[5/4]'
                    : 'photo-card aspect-[4/5] sm:aspect-[4/3] lg:aspect-[5/4]'
                }`}
              >
                {slides.map((slide, slideIndex) => {
                  const active = slideIndex === index;
                  const showImage = slide.kind === 'image' || broken[slideIndex];
                  const imageSrc = slide.kind === 'image' ? slide.src : slide.poster || '/photos/kitchen.jpg';
                  return (
                    <div
                      key={`${slide.src}-${slideIndex}`}
                      className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                      aria-hidden={!active}
                    >
                      {showImage ? (
                        <Image
                          src={imageSrc}
                          alt={active ? slide.alt : ''}
                          fill
                          sizes="(max-width: 1024px) 100vw, 46vw"
                          className="object-cover"
                          priority={slideIndex === 0}
                        />
                      ) : (
                        <video
                          src={slide.src}
                          poster={slide.poster || undefined}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          aria-label={slide.alt}
                          className="absolute inset-0 size-full object-cover"
                          onError={() => setBroken((prev) => ({ ...prev, [slideIndex]: true }))}
                        />
                      )}
                    </div>
                  );
                })}
                {!brand ? <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#0a088f]/15" /> : null}
                {current.caption ? (
                  <p className="absolute inset-x-5 bottom-5 m-0 text-[15px] font-semibold text-white">{current.caption}</p>
                ) : null}
              </div>

              {badge?.label ? (
                <div className="absolute end-3 top-3 z-10 sm:end-5 sm:top-5">
                  {badge.href ? (
                    <Link
                      href={badge.href}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-[#0a088f] no-underline shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                    >
                      <span aria-hidden className="text-[16px] leading-none">
                        🇵🇹
                      </span>
                      <span>
                        {badge.label.includes('Portugal') ? (
                          <>
                            {badge.label.replace(/Portugal/i, '').trim()}{' '}
                            <em className="accent-italic not-italic" style={{ fontStyle: 'italic', color: '#c9a54a' }}>
                              Portugal
                            </em>
                          </>
                        ) : (
                          badge.label
                        )}
                      </span>
                      <span aria-hidden className="text-[var(--color-gold)]">
                        →
                      </span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-[#0a088f] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                      <span aria-hidden className="text-[16px] leading-none">
                        🇵🇹
                      </span>
                      {badge.label}
                    </span>
                  )}
                </div>
              ) : null}

              {count > 1 ? (
                <div className={`mt-5 flex flex-wrap items-center gap-3 ${brand ? 'text-white/80' : ''}`}>
                  <button type="button" className="stage-nav" aria-label="Previous slide" onClick={() => go(index - 1)}>
                    ‹
                  </button>
                  <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
                    {slides.map((slide, slideIndex) => (
                      <button
                        key={`${slide.src}-dot-${slideIndex}`}
                        type="button"
                        role="tab"
                        aria-selected={slideIndex === index}
                        aria-label={slide.caption || `Slide ${slideIndex + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          slideIndex === index
                            ? brand
                              ? 'w-8 bg-[var(--color-gold)]'
                              : 'w-8 bg-[linear-gradient(90deg,#0a088f,#3c8fd4,#7eb6e8)]'
                            : brand
                              ? 'w-2.5 bg-white/35'
                              : 'w-2.5 bg-line-strong'
                        }`}
                        onClick={() => setIndex(slideIndex)}
                      />
                    ))}
                  </div>
                  <button type="button" className="stage-nav" aria-label="Next slide" onClick={() => go(index + 1)}>
                    ›
                  </button>
                  <button
                    type="button"
                    className="stage-nav px-3 text-[12px] font-semibold tracking-[0.08em] uppercase"
                    onClick={() => setPaused((value) => !value)}
                  >
                    {paused ? 'Play' : 'Pause'}
                  </button>
                  {!reduce ? (
                    <span className="hero-progress-track" aria-hidden>
                      <span key={`${index}-${paused}`} className={paused ? 'hero-progress is-paused' : 'hero-progress'} />
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
