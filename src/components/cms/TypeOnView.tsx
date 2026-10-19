'use client';

import { useEffect, useRef } from 'react';

/**
 * Text that types itself out the first time it scrolls into view.
 *
 * The server renders the whole text, so it is there without JavaScript and
 * for search engines. An invisible copy holds the final height, so nothing
 * below jumps while it types. Screen readers get the full text once, from
 * the sr-only copy, never letter by letter. Reduced motion shows it at once.
 */
export function TypeOnView({ text, speed = 16, className = '' }: { text: string; speed?: number; className?: string }) {
  const typed = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = typed.current;
    if (!node || !text) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* Grapheme-aware, so Devanagari and Tamil clusters are never split mid-letter. */
    const parts = typeof Intl.Segmenter === 'function' ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment) : Array.from(text);
    let timer = 0;
    let index = 0;

    node.textContent = '';
    node.classList.add('type-caret');

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        timer = window.setInterval(() => {
          /* A few characters per tick on long text, so no card types for
             longer than about two seconds. */
          const step = Math.max(1, Math.ceil(parts.length / 120));
          index = Math.min(parts.length, index + step);
          node.textContent = parts.slice(0, index).join('');
          if (index >= parts.length) {
            window.clearInterval(timer);
            window.setTimeout(() => node.classList.remove('type-caret'), 1600);
          }
        }, speed);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      node.textContent = text;
      node.classList.remove('type-caret');
    };
  }, [text, speed]);

  return (
    <span className={`relative block ${className}`}>
      <span aria-hidden className="invisible">{text}</span>
      <span ref={typed} aria-hidden className="absolute inset-0">{text}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
