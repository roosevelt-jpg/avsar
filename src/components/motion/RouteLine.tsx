'use client';

import { useInView } from './useInView';

/**
 * The logo's dotted route, drawn across a section as it comes into view.
 *
 * The mark is two points joined by a route: a filled dot where the candidate
 * is and an open ring where the job is. This is that line at page scale, so
 * the thing the logo says in 28 pixels is said again between sections.
 *
 * The dash pattern is the logo's, and the draw is a dashoffset animation, so
 * the line arrives the way a route is travelled rather than fading in.
 */
export function RouteLine({
  tone = 'light',
  className = '',
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const { ref, seen } = useInView<HTMLDivElement>('0px 0px -20% 0px');

  const ink = tone === 'dark' ? '#F7F5F0' : '#1B1A17';
  const origin = tone === 'dark' ? '#C96A4B' : '#B9583A';

  return (
    <div ref={ref} className={className} aria-hidden>
      <svg viewBox="0 0 1000 90" fill="none" className="w-full" preserveAspectRatio="none">
        <path
          d="M24 66 C 300 6, 700 6, 976 66"
          stroke={ink}
          strokeWidth={2.5}
          strokeDasharray="1 14"
          strokeLinecap="round"
          /* 1400 is comfortably longer than the path, so the offset covers it
             whatever the viewport does to the aspect ratio. */
          style={{
            strokeDashoffset: seen ? 0 : 1400,
            transition: 'stroke-dashoffset 1400ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          opacity={0.55}
        />
      </svg>

      {/* The two ends, in the logo's own shapes. */}
      <div className="-mt-[46px] flex items-center justify-between px-[2px]">
        <span
          className="size-[13px] rounded-full motion-safe:transition-transform motion-safe:duration-500"
          style={{ background: origin, transform: seen ? 'scale(1)' : 'scale(0)' }}
        />
        <span
          className="size-[13px] rounded-full border-[3px] motion-safe:transition-transform motion-safe:duration-500"
          style={{
            borderColor: ink,
            transform: seen ? 'scale(1)' : 'scale(0)',
            transitionDelay: seen ? '1100ms' : '0ms',
          }}
        />
      </div>
    </div>
  );
}
