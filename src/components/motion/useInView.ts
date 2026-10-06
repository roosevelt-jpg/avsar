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
/** Nothing to animate for: no observer, or the reader asked for less motion. */
function motionIsUnwanted(): boolean {
  return (
    typeof window === 'undefined' ||
    typeof IntersectionObserver === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function useInView<T extends HTMLElement>(margin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);
  /*
    Read once, at the first render, rather than set from inside the effect.
    Setting it in the effect would schedule a second render for every element
    on the page on the same tick, which is the cascade the compiler warns about
    and which, on a page with twenty of these, is measurable.
  */
  const [seen, setSeen] = useState(() => motionIsUnwanted());

  useEffect(() => {
    const node = ref.current;
    if (!node || motionIsUnwanted()) return;

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
