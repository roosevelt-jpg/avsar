/**
 * Interview times, for people nine time zones apart.
 *
 * Recruiters in Lisbon or Dubai and candidates in India both read the same
 * interview, so every time is stored in UTC and always shown twice: in India
 * time and in Lisbon time. The candidate never has to do the arithmetic, and
 * the Portuguese summer-time switch cannot catch anyone out.
 */

export const INTERVIEW_ZONES = ['Asia/Kolkata', 'Europe/Lisbon'] as const;
export type InterviewZone = (typeof INTERVIEW_ZONES)[number];

/** Minutes the zone is ahead of UTC at a given instant. */
function offsetMinutes(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asIfUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asIfUtc - utcMs) / 60_000);
}

/**
 * A wall-clock time typed into a `datetime-local` input ("2026-10-16T14:00"),
 * read as local time in `timeZone`, as a UTC instant. Two passes, so a time
 * near a daylight-saving switch lands on the right side of it.
 */
export function zonedLocalToUtc(local: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number];
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  if (Number.isNaN(naive)) return null;
  const first = offsetMinutes(naive, timeZone);
  let utc = naive - first * 60_000;
  const second = offsetMinutes(utc, timeZone);
  if (second !== first) utc = naive - second * 60_000;
  return new Date(utc);
}

function format(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function interviewTimes(startsAt: string | Date): { india: string; lisbon: string; both: string } {
  const date = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  const india = `${format(date, 'Asia/Kolkata')} India time`;
  const lisbon = `${format(date, 'Europe/Lisbon')} Lisbon time`;
  return { india, lisbon, both: `${india} (${lisbon})` };
}

export const INTERVIEW_MODE_LABELS = {
  video: 'Video call',
  phone: 'Phone call',
  in_person: 'In person',
} as const;

export type InterviewMode = keyof typeof INTERVIEW_MODE_LABELS;

export type Interview = {
  id: string;
  applicationId: string;
  startsAt: string;
  durationMinutes: number;
  timezone: InterviewZone;
  mode: InterviewMode;
  link: string | null;
  location: string | null;
  candidateMessage: string | null;
  status: 'scheduled' | 'cancelled' | 'done';
};

export const INTERVIEW_COLUMNS =
  'id, application_id, starts_at, duration_minutes, timezone, mode, link, location, candidate_message, status';

export function interviewFromRow(row: Record<string, unknown>): Interview {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    startsAt: String(row.starts_at),
    durationMinutes: Number(row.duration_minutes ?? 30),
    timezone: row.timezone === 'Europe/Lisbon' ? 'Europe/Lisbon' : 'Asia/Kolkata',
    mode: (['video', 'phone', 'in_person'].includes(String(row.mode)) ? row.mode : 'video') as InterviewMode,
    link: (row.link as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    candidateMessage: (row.candidate_message as string | null) ?? null,
    status: (['scheduled', 'cancelled', 'done'].includes(String(row.status)) ? row.status : 'scheduled') as Interview['status'],
  };
}
