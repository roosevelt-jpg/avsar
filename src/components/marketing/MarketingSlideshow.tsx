'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const DWELL_MS = 6500;

/**
 * Full-bleed or framed photograph slideshow for marketing heroes that are not
 * CMS HeroStage (job detail, signup). Pause on hover and respect reduced motion.
 */
export function MarketingSlideshow({
  slides,
  className = '',
  sizes = '100vw',
  rounded = false,
}: {
  slides: { src: string; alt: string }[];
  className?: string;
  sizes?: string;
  rounded?: boolean;
}) {
  const list = slides.filter((slide) => slide.src);
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
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % list.length), DWELL_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduce, list.length]);

  if (list.length === 0) return null;
  const current = list[index]!;

  return (
    <div
      className={`relative overflow-hidden bg-[#1614a8] ${rounded ? 'rounded-[18px]' : ''} ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={current.alt || 'Photographs'}
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
            sizes={sizes}
            unoptimized={!slide.src.startsWith('/')}
            className="object-cover"
          />
        </div>
      ))}
      {list.length > 1 ? (
        <div className="absolute bottom-4 end-4 z-10 flex items-center gap-1.5">
          {list.map((slide, slideIndex) => (
            <button
              key={`${slide.src}-dot-${slideIndex}`}
              type="button"
              aria-label={`Slide ${slideIndex + 1}`}
              className={`h-1.5 rounded-full transition-all ${slideIndex === index ? 'w-8 bg-[var(--color-gold)]' : 'w-2.5 bg-white/50'}`}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
