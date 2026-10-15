import { describe, expect, it } from 'vitest';
import { interviewTimes, zonedLocalToUtc } from '@/lib/interviews/time';
import { csvCell, toCsv } from '@/lib/csv';

describe('zonedLocalToUtc', () => {
  it('reads India time (UTC+5:30, no daylight saving)', () => {
    expect(zonedLocalToUtc('2026-10-16T14:00', 'Asia/Kolkata')?.toISOString()).toBe('2026-10-16T08:30:00.000Z');
  });

  it('reads Lisbon summer time (UTC+1) and winter time (UTC+0)', () => {
    expect(zonedLocalToUtc('2026-07-01T10:00', 'Europe/Lisbon')?.toISOString()).toBe('2026-07-01T09:00:00.000Z');
    expect(zonedLocalToUtc('2026-12-01T10:00', 'Europe/Lisbon')?.toISOString()).toBe('2026-12-01T10:00:00.000Z');
  });

  it('lands on the right side of the October switch', () => {
    /* Portugal leaves summer time at 02:00 on 25 October 2026. */
    expect(zonedLocalToUtc('2026-10-24T12:00', 'Europe/Lisbon')?.toISOString()).toBe('2026-10-24T11:00:00.000Z');
    expect(zonedLocalToUtc('2026-10-26T12:00', 'Europe/Lisbon')?.toISOString()).toBe('2026-10-26T12:00:00.000Z');
  });

  it('rejects anything that is not a datetime-local value', () => {
    expect(zonedLocalToUtc('16/10/2026 14:00', 'Asia/Kolkata')).toBeNull();
    expect(zonedLocalToUtc('', 'Asia/Kolkata')).toBeNull();
  });
});

describe('interviewTimes', () => {
  it('shows the same instant in India and Lisbon', () => {
    const times = interviewTimes('2026-10-16T08:30:00.000Z');
    expect(times.india).toContain('14:00');
    expect(times.india).toContain('India time');
    expect(times.lisbon).toContain('09:30');
    expect(times.both).toBe(`${times.india} (${times.lisbon})`);
  });
});

describe('csv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('Kochi, Kerala')).toBe('"Kochi, Kerala"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(4)).toBe('4');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell('+91 98765')).toBe("'+91 98765");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });

  it('starts with a BOM and uses CRLF', () => {
    const csv = toCsv(['a', 'b'], [[1, 'x']]);
    expect(csv.startsWith('\uFEFFa,b\r\n1,x\r\n')).toBe(true);
  });
});
