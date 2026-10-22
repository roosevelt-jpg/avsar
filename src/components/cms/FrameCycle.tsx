'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const DWELL_MS = 4500;

/**
 * Several photographs in one frame. The "if you are selected" side was a
 * single picture, so the contract, the room, the flight and the visa file
 * take turns. Reduced motion holds the first frame.
 */
export function FrameCycle({ frames, alt }: { frames: { src: string; alt: string }[]; alt: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (frames.length < 2) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, DWELL_MS);
    return () => window.clearInterval(timer);
  }, [frames.length]);

  if (!frames.length) return null;

  return (
    <div className="relative size-full">
      {frames.map((frame, frameIndex) => {
        const active = frameIndex === index;
        return (
          <Image
            key={frame.src}
            src={frame.src}
            alt={active ? frame.alt || alt : ''}
            fill
            sizes="(max-width: 1024px) 100vw, 46vw"
            className={`${frame.src.includes('/illustrations/') ? 'illustration object-contain' : 'object-cover'} transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}
          />
        );
      })}
      {frames.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {frames.map((frame, frameIndex) => (
            <button
              key={frame.src}
              type="button"
              aria-label={frame.alt || `Image ${frameIndex + 1}`}
              className={`h-1.5 rounded-full ${frameIndex === index ? 'w-6 bg-[#c96a4b]' : 'w-1.5 bg-white/80'}`}
              onClick={() => setIndex(frameIndex)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
