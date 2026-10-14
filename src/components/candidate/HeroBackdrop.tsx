'use client';

import Image from 'next/image';
import { useSyncExternalStore } from 'react';

/**
 * The hero's moving backdrop, behind a terracotta curtain.
 *
 * Decorative and nothing else: it carries no information the page does not
 * state in words, so it is hidden from assistive technology entirely.
 *
 * The curtain is two layers rather than one flat fill. A solid accent over
 * footage erases it, and footage with no wash under white type is unreadable at
 * the first bright frame. Multiplying the accent turns the clip into a
 * terracotta duotone, keeping its shapes, and a vertical darkening on top holds
 * the contrast steady wherever the exposure happens to go.
 */

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/**
 * Whether to hold the video back.
 *
 * Three reasons, and any one of them is enough.
 *
 * Reduced motion, because somebody asked their system for it.
 *
 * Save-Data, because somebody asked their browser for it, which is a request
 * not to spend their money on things like this.
 *
 * A 2G connection, because three megabytes of decoration on a metered phone in
 * a market where data is bought in hundreds of megabytes is a real cost charged
 * to the person this page exists for. The poster under the same curtain looks
 * close enough that almost nobody will know what they did not download.
 */
function videoIsUnwanted(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;

  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
}

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', onChange);

  const connection = (navigator as Navigator & { connection?: EventTarget }).connection;
  connection?.addEventListener('change', onChange);

  return () => {
    query.removeEventListener('change', onChange);
    connection?.removeEventListener('change', onChange);
  };
}

/**
 * Read as a subscription rather than in an effect.
 *
 * `useSyncExternalStore` is built for exactly this: the server snapshot says
 * "hold it back", so the first client render matches the HTML and there is no
 * hydration mismatch, and the real answer arrives before paint rather than
 * after. Reading it with a plain effect is what put this codebase's scroll
 * reveals into a mismatch once already.
 */
function useVideoIsUnwanted(): boolean {
  return useSyncExternalStore(subscribe, videoIsUnwanted, () => true);
}

export function HeroBackdrop() {
  const reduced = useVideoIsUnwanted();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/*
        The poster is always there, under the video.

        It is what a reader sees while the clip arrives, what they see if the
        file never arrives, and the whole backdrop for anybody the checks below
        decide should not be sent three megabytes.
      */}
      <Image
        src="/video/hero-poster.jpg"
        alt=""
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />

      {!reduced && (
        <video
          src="/video/hero-loop.mp4"
          poster="/video/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          /* `muted` is what makes autoplay allowed at all, and `playsInline`
             is what stops iOS taking the clip fullscreen on play. */
          preload="auto"
          className="absolute inset-0 size-full object-cover"
        />
      )}

      {/* The curtain. */}
      <span className="absolute inset-0 bg-accent opacity-90 mix-blend-multiply" />
      <span className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/30 to-ink/75" />
    </div>
  );
}
