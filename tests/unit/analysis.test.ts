import { describe, expect, it } from 'vitest';
import { briefingFromFacts, scoreReadingFromFacts } from '@/lib/console/analysis';

describe('analysis stays inside the counts', () => {
  it('restates the week without a promise', () => {
    const briefing = briefingFromFacts({
      since: '2026-10-20',
      newAccounts: 6,
      profilesComplete: 5,
      finishedTests: 4,
      applications: 3,
      interviews: 1,
      openJobs: 8,
      awaitingPayment: 4,
      familyLinks: 2,
      employerVacancies: 7,
      employerApplicants: 9,
      assessedPool: 40,
      inboxNew: 2,
      legalWaiting: 1,
      documentsWaiting: 3,
      talk: 2,
      familySent: 1,
      familyFailed: 0,
      checkoutsOpen: 3,
      paid: 1,
    });
    expect(briefing.summary).toContain('applicant dashboards');
    expect(briefing.summary).toContain('9 applicants they can open');
    expect(briefing.summary).toContain('2 asked to talk');
    expect(briefing.summary).toContain('3 opened checkout');
    expect(briefing.summary).toContain('1 payments completed');
    expect(briefing.summary).toContain('3 visa documents waiting');
    expect(briefing.summary).not.toMatch(/guaranteed|visa (is |will be )approved/i);
    expect(briefing.source).toBe('counts');
  });

  it('reads the free score and names the strongest field', () => {
    const reading = scoreReadingFromFacts({ scoreOutOf10: '7.2', strongest: 'care', above: true });
    expect(reading).toContain('7.2');
    expect(reading).toContain('care');
    expect(reading).toContain('Applying stays free');
    expect(reading).not.toMatch(/guaranteed (job|visa)/i);
  });
});
