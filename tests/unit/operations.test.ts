import { describe, expect, it } from 'vitest';
import { normalisePhone } from '@/lib/leads/phone';
import { parseCsv, readLeadRows } from '@/lib/leads/import';
import { benchReady, computeReadiness, scoreKinds } from '@/lib/relocation/documents';
import { isOverdue, MILESTONE_TEMPLATE, nextMilestone, planFrom, progress } from '@/lib/relocation/milestones';
import { matchScore } from '@/lib/hiring/match';
import { maskName, redactContact } from '@/lib/hiring/redact';
import { averageScore, scorecardSchema } from '@/lib/hiring/scorecard';

describe('normalisePhone', () => {
  it('reads the ways Indian mobiles are typed', () => {
    expect(normalisePhone('98123 45678')).toBe('+919812345678');
    expect(normalisePhone('098123-45678')).toBe('+919812345678');
    expect(normalisePhone('0091 98123 45678')).toBe('+919812345678');
    expect(normalisePhone('+91 (981) 234 5678')).toBe('+919812345678');
    expect(normalisePhone('919812345678')).toBe('+919812345678');
  });

  it('keeps a foreign country code', () => {
    expect(normalisePhone('+351 912 345 678')).toBe('+351912345678');
  });

  it('refuses what it cannot read rather than guessing', () => {
    expect(normalisePhone('12345')).toBeNull();
    expect(normalisePhone('+91 2212345678')).toBeNull();
    expect(normalisePhone('call me')).toBeNull();
    expect(normalisePhone('')).toBeNull();
  });
});

describe('parseCsv and readLeadRows', () => {
  it('handles a BOM, semicolons, quotes and CRLF', () => {
    const rows = parseCsv('\uFEFFName;Mobile;Notes\r\n"Nair, Arjun";98123 45678;"said ""yes"""\r\n');
    expect(rows).toEqual([
      ['Name', 'Mobile', 'Notes'],
      ['Nair, Arjun', '98123 45678', 'said "yes"'],
    ]);
  });

  it('maps partner column names, reports bad lines by spreadsheet line, and drops in-file duplicates', () => {
    const result = readLeadRows(
      parseCsv(
        [
          'First name,Surname,WhatsApp number,Email ID,Trade,Favourite colour',
          'Arjun,Nair,98123 45678,,Chef,blue',
          'Priya,Sharma,,priya@example.com,Cleaner,',
          'Arjun,Nair,+91 98123 45678,,Chef,',
          ',,98765 43210,,,',
          'Ravi,Kumar,12345,,,',
        ].join('\n'),
      ),
    );
    expect(result.leads.map((l) => [l.line, l.fullName, l.phone ?? l.email])).toEqual([
      [2, 'Arjun Nair', '+919812345678'],
      [3, 'Priya Sharma', 'priya@example.com'],
    ]);
    expect(result.problems.map((p) => p.line)).toEqual([4, 5, 6]);
    expect(result.unmatchedColumns).toEqual(['Favourite colour']);
    expect(result.leads.every((l) => l.whatsappOk === false)).toBe(true);
  });

  it('refuses a file with no phone or email column', () => {
    expect(readLeadRows([['Name', 'City']]).problems[0]?.line).toBe(1);
  });
});

describe('visa file readiness', () => {
  const today = new Date('2026-10-15T12:00:00Z');

  it('needs passport, police clearance and contract, plus enough else to pass the threshold', () => {
    expect(scoreKinds(['passport', 'police_clearance', 'contract']).ready).toBe(false);
    expect(scoreKinds(['passport', 'police_clearance', 'contract', 'insurance']).ready).toBe(true);
    expect(scoreKinds(['passport', 'police_clearance', 'insurance', 'accommodation', 'photo', 'medical']).ready).toBe(false);
  });

  it('ignores expired, superseded and unverified documents', () => {
    const readiness = computeReadiness(
      [
        { kind: 'passport', status: 'verified', expiresOn: '2030-01-01' },
        { kind: 'police_clearance', status: 'verified', expiresOn: '2026-10-01' },
        { kind: 'contract', status: 'uploaded', expiresOn: null },
        { kind: 'photo', status: 'verified', expiresOn: null, supersededAt: '2026-10-10T00:00:00Z' },
      ],
      today,
    );
    expect(readiness.verified).toEqual(['passport']);
    expect(readiness.awaitingReview).toEqual(['contract']);
    expect(readiness.missing).toContain('police_clearance');
    expect(readiness.ready).toBe(false);
  });

  it('warns about a verified document expiring soon', () => {
    const readiness = computeReadiness([{ kind: 'police_clearance', status: 'verified', expiresOn: '2026-11-01' }], today);
    expect(readiness.expiringSoon).toEqual(['police_clearance']);
  });

  it('puts a candidate on the bench only with passport and police clearance', () => {
    expect(benchReady(['passport'])).toBe(false);
    expect(benchReady(['passport', 'police_clearance'])).toBe(true);
  });
});

describe('relocation plan', () => {
  it('builds every step from the start date, in order', () => {
    const plan = planFrom('2026-11-01');
    expect(plan).toHaveLength(MILESTONE_TEMPLATE.length);
    expect(plan[0]).toEqual({ key: 'contract_signed', position: 1, due_on: '2026-11-08' });
    expect(plan.map((p) => p.due_on)).toEqual([...plan.map((p) => p.due_on)].sort());
  });

  it('knows what is overdue, next and done', () => {
    const steps = [
      { status: 'done' as const, position: 1, dueOn: '2026-10-01' },
      { status: 'skipped' as const, position: 2, dueOn: '2026-10-02' },
      { status: 'blocked' as const, position: 3, dueOn: '2026-10-10' },
      { status: 'pending' as const, position: 4, dueOn: '2026-12-01' },
    ];
    expect(isOverdue(steps[2]!, '2026-10-15')).toBe(true);
    expect(isOverdue(steps[0]!, '2026-10-15')).toBe(false);
    expect(isOverdue(steps[3]!, '2026-10-15')).toBe(false);
    expect(nextMilestone(steps)?.position).toBe(3);
    expect(progress(steps)).toEqual({ done: 1, total: 3 });
  });
});

describe('matchScore', () => {
  const job = { position: 'chef', sector: 'food-beverage', minEnglish: 'B1' as const, minYears: 3 };

  it('gives full marks to a complete fit and explains every point', () => {
    const result = matchScore(job, { position: 'chef', sector: 'food-beverage', english: 'B2', yearsExperience: 4, overallScore: 100, verifiedDocuments: ['passport', 'police_clearance', 'contract', 'insurance', 'accommodation', 'photo', 'qualification', 'medical'] });
    expect(result.score).toBe(100);
    expect(result.parts.every((p) => p.reason.length > 0)).toBe(true);
  });

  it('scores what it does not know as zero, not as average', () => {
    const result = matchScore(job, { position: null, sector: null, english: null, yearsExperience: null, overallScore: null, verifiedDocuments: [] });
    expect(result.score).toBe(0);
  });

  it('costs points for English below the minimum', () => {
    const at = matchScore(job, { position: 'chef', sector: 'food-beverage', english: 'B1', yearsExperience: 3, overallScore: 50, verifiedDocuments: [] });
    const below = matchScore(job, { position: 'chef', sector: 'food-beverage', english: 'A2', yearsExperience: 3, overallScore: 50, verifiedDocuments: [] });
    expect(at.score - below.score).toBe(12);
  });
});

describe('redaction', () => {
  it('masks a name to first name and initial, as the SQL does', () => {
    expect(maskName('Arjun Kumar Nair')).toBe('Arjun N.');
    expect(maskName('Priya')).toBe('Priya');
    expect(maskName('  ')).toBe('Candidate');
    expect(maskName(null)).toBe('Candidate');
  });

  it('cuts contact details out of free text', () => {
    const text = redactContact('Call +91 98123 45678 or mail arjun@example.com, linkedin.com/in/arjun, @arjun_cooks');
    expect(text).not.toMatch(/98123|example\.com|linkedin|arjun_cooks/);
  });
});

describe('scorecards', () => {
  it('accepts scores 1 to 5 and averages to one decimal', () => {
    const parsed = scorecardSchema.parse({ criteria: [{ label: 'English', score: 4 }, { label: 'Hygiene', score: 3 }], recommendation: 'advance' });
    expect(parsed.summary).toBe('');
    expect(averageScore(parsed.criteria)).toBe(3.5);
  });

  it('refuses out-of-range scores and unknown recommendations', () => {
    expect(scorecardSchema.safeParse({ criteria: [{ label: 'English', score: 6 }], recommendation: 'advance' }).success).toBe(false);
    expect(scorecardSchema.safeParse({ criteria: [{ label: 'English', score: 3 }], recommendation: 'hire' }).success).toBe(false);
  });
});
