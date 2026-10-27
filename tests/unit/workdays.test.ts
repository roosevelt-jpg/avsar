import { describe, expect, it } from 'vitest';
import { overdueCreatedOnOrBefore, replyClock, workingDaysSince } from '@/lib/console/workdays';

const monday = new Date('2026-10-05T10:00:00+05:30');
const fridayAfter = new Date('2026-10-16T10:00:00+05:30');

describe('working days', () => {
  it('does not count the day an application arrives', () => {
    expect(workingDaysSince('2026-10-05T10:00:00+05:30', monday)).toBe(0);
  });

  it('skips the weekend', () => {
    expect(workingDaysSince('2026-10-05T10:00:00+05:30', fridayAfter)).toBe(9);
  });

  it('marks the promise late on the day the count is reached', () => {
    const clock = replyClock('2026-10-05T10:00:00+05:30', 10, new Date('2026-10-19T09:00:00+05:30'));
    expect(clock.elapsed).toBe(10);
    expect(clock.overdue).toBe(true);
    expect(overdueCreatedOnOrBefore(10, new Date('2026-10-19T09:00:00+05:30'))).toBe('2026-10-05');
  });

  it('calls the two days before the promise due soon', () => {
    const clock = replyClock('2026-10-05T10:00:00+05:30', 10, new Date('2026-10-15T09:00:00+05:30'));
    expect(clock.overdue).toBe(false);
    expect(clock.dueSoon).toBe(true);
  });
});
