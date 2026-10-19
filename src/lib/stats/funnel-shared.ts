/**
 * The live selection funnel, as shown on public pages. Client-safe.
 */

export type FunnelStats = {
  completed: number;
  qualified: number;
  shortlisted: number;
  hired: number;
  /** ISO time the counts were read, so the page can say how fresh they are. */
  readAt: string;
};

export const EMPTY_FUNNEL: FunnelStats = { completed: 0, qualified: 0, shortlisted: 0, hired: 0, readAt: new Date(0).toISOString() };

/**
 * Out of every 100 who finished the test. Whole numbers from 10 up, one
 * decimal below that, so 4 hires in 1,000 reads "0.4" rather than rounding
 * to a misleading 0.
 */
export function per100(count: number, completed: number): string {
  if (completed <= 0) return '0';
  const value = (count / completed) * 100;
  if (value >= 10 || value === 0) return String(Math.round(value));
  return value.toFixed(1).replace(/\.0$/, '');
}

/** Bar width in percent, with a sliver for small non-zero stages so they stay visible. */
export function barWidth(count: number, completed: number): number {
  if (completed <= 0 || count <= 0) return 0;
  return Math.max(2, Math.round((count / completed) * 100));
}
