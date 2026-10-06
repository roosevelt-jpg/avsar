'use client';

import { useInView } from './useInView';

/**
 * Fades a block in as it arrives.
 *
 * Deliberately small: eight pixels and a third of a second. The job is to make
 * a long page feel alive as it is read, not to make the reader wait for it.
 *
 * `delay` staggers siblings. Keep the steps small, 60 to 90ms: a stagger long
 * enough to notice is a stagger long enough to be in the way.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  as?: 'div' | 'li' | 'section' | 'p';
  className?: string;
}) {
  const { ref, seen } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`motion-safe:transition-[opacity,transform] motion-safe:duration-[420ms] motion-safe:ease-out ${
        seen ? 'opacity-100 translate-y-0' : 'motion-safe:opacity-0 motion-safe:translate-y-2'
      } ${className}`}
      style={seen ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
