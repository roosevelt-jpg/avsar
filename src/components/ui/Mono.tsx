import type { ReactNode } from 'react';

/**
 * Mono label. Used for eyebrows, step numbers, price metadata and table
 * headers, at 11-13px, per the handoff.
 */
export function Mono({
  children,
  className = '',
  as: Tag = 'span',
}: {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'th';
}) {
  return <Tag className={`font-mono text-[12px] ${className}`}>{children}</Tag>;
}
