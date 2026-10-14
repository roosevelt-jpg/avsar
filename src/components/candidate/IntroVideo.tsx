'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import type { Dictionary } from '@/lib/i18n';

/**
 * The film, behind its own poster.
 *
 * The file is five megabytes. Most of the people this page is for are on
 * mobile data in India, and a `<video>` in the markup starts fetching before
 * anybody has said they want to watch it, so what loads with the page is a
 * thirty-kilobyte still and the real thing arrives on a click.
 *
 * It is a person speaking, so it never plays on its own. The click is the
 * gesture that lets the browser play it with sound.
 */
export function IntroVideo({ t }: { t: Dictionary }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="m-0 w-full max-w-[720px]">
      <div className="relative aspect-video w-full overflow-hidden rounded-[20px] bg-ink shadow-[0_24px_60px_-28px_rgba(27,26,23,0.55)] ring-1 ring-line">
        {playing ? (
          <video
            src="/video/intro.mp4"
            poster="/video/intro-poster.jpg"
            controls
            autoPlay
            playsInline
            preload="auto"
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 size-full cursor-pointer border-0 bg-transparent p-0"
          >
            <Image
              src="/video/intro-poster.jpg"
              alt=""
              fill
              sizes="(max-width: 760px) 100vw, 720px"
              priority
              className="object-cover"
            />
            {/* A wash under the button, so the glyph holds whatever frame the
                poster happens to be. Paper rather than terracotta: the film
                opens on a terracotta illustration, and an accent button on top
                of it read as part of the artwork rather than as a control. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(13,12,11,0.34),rgba(13,12,11,0.06))]"
            />
            <span className="absolute left-1/2 top-1/2 flex size-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-ink shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out motion-safe:group-hover:scale-110">
              <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden>
                {/* Nudged right: a triangle centred on its bounding box reads
                    as sitting left of centre inside a circle. */}
                <path d="M9 5.5 L19 12 L9 18.5 Z" fill="currentColor" />
              </svg>
              <span className="sr-only">{t.videoPlay}</span>
            </span>
          </button>
        )}
      </div>

      <figcaption className="mt-3 text-center">
        <Mono className="text-muted">{t.videoLabel}</Mono>
      </figcaption>
    </figure>
  );
}
