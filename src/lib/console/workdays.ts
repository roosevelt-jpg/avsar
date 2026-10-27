/**
 * Working days for the reply promise.
 *
 * The promise is a number of weekdays in Settings, counted in India time,
 * because that is the clock candidates and the recruiting team share.
 * The day the application arrives does not count: a Monday application is
 * still inside a 10-day promise on the following Monday morning.
 */

const ZONE = 'Asia/Kolkata';

export function zonedDate(instant: Date, timeZone = ZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const next = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days));
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function isWeekend(iso: string): boolean {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const day = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).getUTCDay();
  return day === 0 || day === 6;
}

/** Weekdays after the calendar day of `from`, through today, India time. */
export function workingDaysSince(fromIso: string, today = new Date()): number {
  const start = zonedDate(new Date(fromIso));
  const end = zonedDate(today);
  if (end <= start) return 0;
  let count = 0;
  let cursor = shiftDate(start, 1);
  while (cursor <= end) {
    if (!isWeekend(cursor)) count += 1;
    cursor = shiftDate(cursor, 1);
  }
  return count;
}

export type ReplyClock = { elapsed: number; limit: number; overdue: boolean; dueSoon: boolean };

export function replyClock(createdAt: string, responseDays: number, today = new Date()): ReplyClock {
  const elapsed = workingDaysSince(createdAt, today);
  const limit = Math.max(0, responseDays);
  const overdue = elapsed >= limit;
  const dueSoon = !overdue && limit > 0 && elapsed >= limit - 2;
  return { elapsed, limit, overdue, dueSoon };
}

/**
 * The latest India calendar date on which an application is already past
 * the promise. Anything created on or before that date is late.
 */
export function overdueCreatedOnOrBefore(responseDays: number, today = new Date()): string {
  const limit = Math.max(0, responseDays);
  let cursor = zonedDate(today);
  for (let i = 0; i < 800; i += 1) {
    const noon = new Date(`${cursor}T12:00:00+05:30`);
    if (workingDaysSince(noon.toISOString(), today) >= limit) return cursor;
    cursor = shiftDate(cursor, -1);
  }
  return cursor;
}
