'use client';

import Image from 'next/image';
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
 */
export function HeroStage({ slides, lead, children }: { slides: HeroSlide[]; lead?: ReactNode; children: ReactNode }) {
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

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Introduction"
      className="relative px-[clamp(20px,4cqi,56px)] pt-[clamp(28px,4cqi,56px)] pb-[clamp(28px,4cqi,56px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative mx-auto w-full max-w-[1200px]">
        {lead ? <div className="mb-4">{lead}</div> : null}
        <div className="grid grid-cols-1 items-start gap-[clamp(28px,4cqi,64px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="min-w-0">{children}</div>

        {current ? (
          <div>
            <div className="photo-card relative aspect-[4/5] bg-night sm:aspect-[4/3] lg:aspect-[5/4]">
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
                      <Image src={imageSrc} alt={active ? slide.alt : ''} fill sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" priority={slideIndex === 0} />
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
              <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#16324f]/15" />
              {current.caption ? (
                <p className="absolute inset-x-5 bottom-5 m-0 text-[15px] font-semibold text-white">{current.caption}</p>
              ) : null}
            </div>

            {count > 1 ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
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
                      className={`h-1.5 rounded-full transition-all duration-300 ${slideIndex === index ? 'w-8 bg-[linear-gradient(90deg,#16324f,#3c8fd4,#7eb6e8)]' : 'w-2.5 bg-line-strong'}`}
                      onClick={() => setIndex(slideIndex)}
                    />
                  ))}
                </div>
                <button type="button" className="stage-nav" aria-label="Next slide" onClick={() => go(index + 1)}>
                  ›
                </button>
                <button type="button" className="stage-nav px-3 text-[12px] font-semibold tracking-[0.08em] uppercase" onClick={() => setPaused((value) => !value)}>
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
