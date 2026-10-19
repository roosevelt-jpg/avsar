/**
 * Reads of the current time, kept out of components.
 *
 * `Date.now()` is impure, and the React Compiler rules refuse it during render.
 * Server Components that need a time-derived value call these instead.
 */

/** Whole seconds between now and an ISO timestamp, floored at zero. */
export function secondsUntil(iso: string): number {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.floor((target - new Date().getTime()) / 1000));
}

/** Whether an ISO timestamp is already behind us. */
export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < new Date().getTime();
}

/** Current instant as an ISO string, for writes. */
export function nowIso(): string {
  return new Date().toISOString();
}
