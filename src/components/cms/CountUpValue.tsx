'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function reducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Counts a leading integer up when the element enters the viewport.
 * Non-numeric values render as-is. Honours prefers-reduced-motion.
 */
export function CountUpValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const match = /^(\d+)(.*)$/.exec(value.trim());
  const target = match ? Number(match[1]) : null;
  const suffix = match?.[2] ?? '';
  const finalLabel = target === null ? value : `${target}${suffix}`;
  const reduce = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => false);
  const [shown, setShown] = useState(target === null ? value : `0${suffix}`);

  useEffect(() => {
    if (target === null || reduce) return;
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || started) return;
        started = true;
        observer.disconnect();
        const duration = Math.min(1400, 400 + target * 40);
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - t) * (1 - t);
          setShown(`${Math.round(target * eased)}${suffix}`);
          if (t < 1) frame = window.requestAnimationFrame(tick);
        };
        frame = window.requestAnimationFrame(tick);
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.35 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [target, suffix, reduce]);

  return (
    <span ref={ref} className={className}>
      {reduce || target === null ? finalLabel : shown}
    </span>
  );
}
