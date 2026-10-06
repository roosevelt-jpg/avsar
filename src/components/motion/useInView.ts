'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Whether an element has been scrolled into view, once.
 *
 * Once, not continuously: an element that fades out again when it leaves and
 * back in when it returns turns a long page into a flickering one. The first
 * arrival is the moment worth marking.
 *
 * Somebody who has asked their system for less motion is treated as having
 * seen everything from the start, so the content is simply there.
 */
export function useInView<T extends HTMLElement>(margin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);
  /*
    Always false at the first render, on the server and on the client alike.

    It used to start from a `window`/`matchMedia` read, which is one answer on
    the server and another in the browser, so every one of these hydrated with
    a different className and style than the HTML it was hydrating. React
    reported the mismatch and kept the server's attributes, which is how whole
    sections ended up pinned at their pre-animation values.

    Reduced motion is not decided here at all any more. The hidden state is
    written entirely with `motion-safe:` variants, so a reader who asked their
    system for less motion never has it applied and sees the page complete;
    the observer below then runs harmlessly.
  */
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    /* No observer: show everything on the next frame rather than never. The
       frame keeps this out of the effect body, where a synchronous setState
       would cascade a render through every element on the page. */
    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin, threshold: 0.12 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [margin]);

  return { ref, seen };
}
