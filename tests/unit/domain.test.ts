import { describe, expect, it } from 'vitest';
import { formatSalary, slugify } from '@/lib/jobs/types';
import { grants } from '@/lib/rbac/permissions';
import { APPLICATION_STATUSES, PIPELINE, STATUS_META, canWithdraw, isApplicationStatus, pipelineIndex } from '@/lib/applications/status';
import { aggregate, parseRange } from '@/lib/console/analytics';

describe('formatSalary', () => {
  it('prints a range', () => {
    expect(formatSalary({ salaryMinEur: 1050, salaryMaxEur: 1250, salaryPeriod: 'month' })).toBe('€1,050 – €1,250 / month');
  });

  it('prints one figure when min equals max or one side is missing', () => {
    expect(formatSalary({ salaryMinEur: 1200, salaryMaxEur: 1200, salaryPeriod: 'month' })).toBe('€1,200 / month');
    expect(formatSalary({ salaryMinEur: null, salaryMaxEur: 9, salaryPeriod: 'hour' })).toBe('€9 / hour');
  });

  it('returns null when no salary was given', () => {
    expect(formatSalary({ salaryMinEur: null, salaryMaxEur: null, salaryPeriod: 'year' })).toBeNull();
  });
});

describe('slugify', () => {
  it('lower-cases, strips accents and hyphenates', () => {
    expect(slugify('MIG/MAG Welder, Setúbal')).toBe('mig-mag-welder-setubal');
  });

  it('trims leading and trailing separators and caps the length', () => {
    expect(slugify('  --Line cook!!  ')).toBe('line-cook');
    expect(slugify('a'.repeat(200))).toHaveLength(80);
  });
});

describe('grants', () => {
  it('honours a held permission', () => {
    expect(grants(new Set(['jobs.edit']), 'jobs.edit')).toBe(true);
    expect(grants(new Set(['jobs.edit']), 'jobs.publish')).toBe(false);
  });

  it('treats * as everything', () => {
    expect(grants(new Set(['*']), 'roles.manage')).toBe(true);
  });

  it('refuses an empty set', () => {
    expect(grants(new Set(), 'dashboard.view')).toBe(false);
  });
});

describe('application status helpers', () => {
  it('every status has candidate copy', () => {
    for (const status of APPLICATION_STATUSES) {
      expect(STATUS_META[status].candidateTitle).toBeTruthy();
      expect(STATUS_META[status].candidateBody).toBeTruthy();
    }
  });

  it('recognises statuses', () => {
    expect(isApplicationStatus('interview')).toBe(true);
    expect(isApplicationStatus('lost')).toBe(false);
  });

  it('draws hired at the offer step and closed states off the bar', () => {
    expect(pipelineIndex('submitted')).toBe(0);
    expect(pipelineIndex('hired')).toBe(PIPELINE.indexOf('offer'));
    expect(pipelineIndex('rejected')).toBe(-1);
  });

  it('allows withdrawal only before hire', () => {
    expect(canWithdraw('submitted')).toBe(true);
    expect(canWithdraw('offer')).toBe(true);
    expect(canWithdraw('hired')).toBe(false);
    expect(canWithdraw('withdrawn')).toBe(false);
  });
});

describe('analytics aggregate', () => {
  type Input = Parameters<typeof aggregate>[0];
  const now = new Date('2026-10-15T12:00:00Z');
  const start = new Date(now.getTime() - 7 * 86_400_000);
  const app = (id: string, status: Input['apps'][number]['status'], createdAt: string): Input['apps'][number] => ({
    id,
    job_id: 'job-1',
    status,
    created_at: createdAt,
    candidates: { position: null, city_state: 'Kochi, Kerala' },
    job_postings: { title: 'Line cook', city: 'Albufeira' },
  });

  const base = (overrides: Partial<Input> = {}): Input => ({
    range: 7,
    now,
    start,
    apps: [],
    currentApps: [],
    prevApps: [],
    events: [],
    candidates: [],
    payments: [],
    live: { openJobs: 0, awaitingReview: 0, interviewsActive: 0, offersOpen: 0 },
    ...overrides,
  });

  it('reports previous: null when the previous period is empty', () => {
    const current = [app('a', 'submitted', '2026-10-14T10:00:00Z')];
    const result = aggregate(base({ apps: current, currentApps: current }));
    const shortlist = result.kpis.find((k) => k.key === 'shortlist');
    const response = result.kpis.find((k) => k.key === 'response');
    expect(shortlist?.previous).toBeNull();
    expect(response?.previous).toBeNull();
    expect(result.daily).toHaveLength(7);
  });

  it('counts the funnel cumulatively by furthest stage', () => {
    const current = [
      app('a', 'submitted', '2026-10-14T10:00:00Z'),
      app('b', 'interview', '2026-10-13T10:00:00Z'),
      app('c', 'hired', '2026-10-12T10:00:00Z'),
    ];
    const { funnel } = aggregate(base({ apps: current, currentApps: current }));
    expect(funnel[0]).toEqual({ stage: 'submitted', reached: 3 });
    expect(funnel.find((f) => f.stage === 'interview')?.reached).toBe(2);
    expect(funnel.find((f) => f.stage === 'offer')?.reached).toBe(1);
  });

  it('takes the median first-response time in hours', () => {
    const current = [app('a', 'screening', '2026-10-14T00:00:00Z'), app('b', 'screening', '2026-10-14T00:00:00Z')];
    const events = [
      { application_id: 'a', created_at: '2026-10-14T10:00:00Z', from_status: 'submitted', to_status: 'screening' },
      { application_id: 'b', created_at: '2026-10-14T20:00:00Z', from_status: 'submitted', to_status: 'screening' },
    ];
    const result = aggregate(base({ apps: current, currentApps: current, events }));
    expect(result.kpis.find((k) => k.key === 'response')?.value).toBe(15);
  });

  it('sums revenue in minor units and groups by state', () => {
    const current = [app('a', 'submitted', '2026-10-14T00:00:00Z')];
    const payments = [
      { paid_at: '2026-10-14T05:00:00Z', amount_paise: 240000, method_hint: 'upi', provider: 'eximpe' },
      { paid_at: '2026-10-01T05:00:00Z', amount_paise: 240000, method_hint: 'card', provider: 'eximpe' },
    ];
    const result = aggregate(base({ apps: current, currentApps: current, payments }));
    const revenue = result.kpis.find((k) => k.key === 'revenue');
    expect(revenue?.value).toBe(240000);
    expect(revenue?.previous).toBe(240000);
    expect(result.paymentMethods).toEqual([{ label: 'UPI', value: 1 }]);
    expect(result.origins).toEqual([{ label: 'Kerala', value: 1 }]);
  });
});

describe('parseRange', () => {
  it('accepts 7, 30 and 90 and defaults to 30', () => {
    expect(parseRange('7')).toBe(7);
    expect(parseRange('90')).toBe(90);
    expect(parseRange('12')).toBe(30);
    expect(parseRange(undefined)).toBe(30);
  });
});
