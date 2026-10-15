import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { PIPELINE, type ApplicationStatus } from '@/lib/applications/status';
import { positionLabel } from '@/lib/data/positions';
import { getSiteSettings } from '@/lib/cms/data';
import type { ChargeCurrency } from '@/lib/company/config';

/**
 * Console analytics: everything the dashboard's cards and charts show, for one
 * date range, computed in one place so every number on the page agrees.
 *
 * Each KPI is compared with the period of the same length immediately before
 * it ("vs previous 30 days"), never with an arbitrary baseline.
 *
 * Rows are fetched for the current and previous period and aggregated here.
 * That is fine to tens of thousands of rows per period. Past that, move the
 * aggregation into a Postgres function (see docs/ROADMAP.md, Analytics).
 */

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(value: string | undefined): RangeDays {
  const n = Number(value);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

export type Kpi = {
  key: string;
  label: string;
  value: number;
  previous: number | null;
  /** How to print the value. */
  format: 'count' | 'money' | 'percent' | 'hours';
  /** For money: the charge currency set on Settings › Company & pricing. */
  currency?: ChargeCurrency;
  /** Whether a rise is good news (drives the delta's colour). */
  upIsGood: boolean;
  /** Daily values across the range, oldest first, for the sparkline. */
  trend: number[];
  href?: string;
};

export type DailyPoint = { date: string; applications: number; signups: number; payments: number };

export type Analytics = {
  range: RangeDays;
  generatedAt: string;
  kpis: Kpi[];
  daily: DailyPoint[];
  /** How many applications in the range reached each stage (cumulative). */
  funnel: { stage: ApplicationStatus; reached: number }[];
  topJobs: { id: string; label: string; value: number }[];
  topRoles: { label: string; value: number }[];
  origins: { label: string; value: number }[];
  paymentMethods: { label: string; value: number }[];
  live: { openJobs: number; awaitingReview: number; interviewsActive: number; offersOpen: number };
};

const DAY = 86_400_000;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function emptyDays(range: number, end: Date): string[] {
  const days: string[] = [];
  for (let i = range - 1; i >= 0; i--) days.push(dayKey(new Date(end.getTime() - i * DAY)));
  return days;
}

function topN(counts: Map<string, number>, n: number) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label, value }));
}

function bump(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** The Indian state from "Kochi, Kerala", which is how candidates write it. */
function stateOf(cityState: string | null): string {
  if (!cityState) return 'Not given';
  const parts = cityState.split(',').map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? 'Not given';
}

type AppRow = { id: string; job_id: string; status: ApplicationStatus; created_at: string; candidates: { position: string | null; city_state: string | null } | null; job_postings: { title: string; city: string } | null };
type EventRow = { application_id: string; created_at: string; to_status: string | null; from_status: string | null };
type CandidateRow = { created_at: string };
type PaymentRow = { paid_at: string | null; amount_paise: number; method_hint: string | null; provider: string };

export async function getAnalytics(range: RangeDays): Promise<Analytics> {
  const now = new Date();
  const start = new Date(now.getTime() - range * DAY);
  const prevStart = new Date(now.getTime() - 2 * range * DAY);

  if (!isSupabaseConfigured()) return emptyAnalytics(range, now);
  const admin = getAdminSupabase();
  if (!admin) return emptyAnalytics(range, now);

  const one = <T,>(value: unknown) => (Array.isArray(value) ? value[0] : value) as T | null;

  const [appsRes, candidatesRes, paymentsRes, jobsRes, liveRes] = await Promise.all([
    admin
      .from('applications')
      .select('id, job_id, status, created_at, candidates (position, city_state), job_postings (title, city)')
      .gte('created_at', prevStart.toISOString())
      .limit(50000),
    admin.from('candidates').select('created_at').gte('created_at', prevStart.toISOString()).limit(100000),
    admin
      .from('payments')
      .select('paid_at, amount_paise, method_hint, provider')
      .eq('status', 'paid')
      .gte('paid_at', prevStart.toISOString())
      .limit(50000),
    admin.from('job_postings').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    admin.from('applications').select('status').in('status', ['submitted', 'interview', 'offer']).limit(50000),
  ]);

  const apps: AppRow[] = (appsRes.data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: String(row.id),
      job_id: String(row.job_id),
      status: row.status as ApplicationStatus,
      created_at: String(row.created_at),
      candidates: one<AppRow['candidates']>(row.candidates),
      job_postings: one<AppRow['job_postings']>(row.job_postings),
    };
  });
  const candidates = (candidatesRes.data ?? []) as CandidateRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];

  /* First response: the first event after "submitted" that moved the status.
     Fetched only for this period's applications. */
  const currentApps = apps.filter((a) => new Date(a.created_at) >= start);
  const prevApps = apps.filter((a) => new Date(a.created_at) < start);
  const ids = apps.map((a) => a.id);
  const events: EventRow[] = [];
  for (let i = 0; i < ids.length; i += 500) {
    const { data } = await admin
      .from('application_events')
      .select('application_id, created_at, to_status, from_status')
      .in('application_id', ids.slice(i, i + 500))
      .not('from_status', 'is', null);
    events.push(...((data ?? []) as EventRow[]));
  }

  const live = { openJobs: jobsRes.count ?? 0, awaitingReview: 0, interviewsActive: 0, offersOpen: 0 };
  for (const row of (liveRes.data ?? []) as { status: string }[]) {
    if (row.status === 'submitted') live.awaitingReview++;
    if (row.status === 'interview') live.interviewsActive++;
    if (row.status === 'offer') live.offersOpen++;
  }

  const currency = (await getSiteSettings()).pricing.chargeCurrency;
  return aggregate({ range, now, start, apps, currentApps, prevApps, events, candidates, payments, live, currency });
}

export function aggregate(input: {
  range: RangeDays;
  currency?: ChargeCurrency;
  now: Date;
  start: Date;
  apps: AppRow[];
  currentApps: AppRow[];
  prevApps: AppRow[];
  events: EventRow[];
  candidates: CandidateRow[];
  payments: PaymentRow[];
  live: Analytics['live'];
}): Analytics {
  const { range, now, start, currentApps, prevApps, events, candidates, payments, live } = input;
  const days = emptyDays(range, now);
  const index = new Map(days.map((d, i) => [d, i]));
  const series = { applications: days.map(() => 0), signups: days.map(() => 0), payments: days.map(() => 0), revenue: days.map(() => 0) };

  for (const a of currentApps) {
    const i = index.get(a.created_at.slice(0, 10));
    if (i !== undefined) series.applications[i]!++;
  }
  const isCurrent = (iso: string | null) => Boolean(iso) && new Date(iso as string) >= start;
  let prevSignups = 0;
  for (const c of candidates) {
    if (isCurrent(c.created_at)) {
      const i = index.get(c.created_at.slice(0, 10));
      if (i !== undefined) series.signups[i]!++;
    } else prevSignups++;
  }
  let prevPaid = 0;
  let prevRevenue = 0;
  const methods = new Map<string, number>();
  for (const p of payments) {
    if (isCurrent(p.paid_at)) {
      const i = index.get((p.paid_at as string).slice(0, 10));
      if (i !== undefined) {
        series.payments[i]!++;
        series.revenue[i]! += p.amount_paise;
      }
      bump(methods, (p.method_hint ?? 'other').toUpperCase());
    } else {
      prevPaid++;
      prevRevenue += p.amount_paise;
    }
  }

  /* Shortlist rate: share of the period's applications that reached shortlist or beyond. */
  const reachedShortlist = (list: AppRow[]) => list.filter((a) => PIPELINE.indexOf(a.status) >= PIPELINE.indexOf('shortlisted') || a.status === 'hired').length;
  const rate = (list: AppRow[]) => (list.length ? (reachedShortlist(list) / list.length) * 100 : 0);

  /* Median hours from application to the first status move. */
  const created = new Map(input.apps.map((a) => [a.id, a.created_at]));
  const firstMove = new Map<string, string>();
  for (const e of events) {
    const prev = firstMove.get(e.application_id);
    if (!prev || e.created_at < prev) firstMove.set(e.application_id, e.created_at);
  }
  const responseHours = (list: AppRow[]) =>
    median(
      list
        .map((a) => {
          const moved = firstMove.get(a.id);
          return moved ? (new Date(moved).getTime() - new Date(created.get(a.id) as string).getTime()) / 3_600_000 : null;
        })
        .filter((h): h is number => h !== null && h >= 0),
    );

  const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

  const kpis: Kpi[] = [
    { key: 'applications', label: 'Applications', value: currentApps.length, previous: prevApps.length, format: 'count', upIsGood: true, trend: series.applications, href: '/admin/applications' },
    { key: 'signups', label: 'New candidates', value: sum(series.signups), previous: prevSignups, format: 'count', upIsGood: true, trend: series.signups, href: '/admin/cohorts' },
    { key: 'paid', label: 'Assessments paid', value: sum(series.payments), previous: prevPaid, format: 'count', upIsGood: true, trend: series.payments, href: '/admin/payments' },
    { key: 'revenue', label: 'Revenue', value: sum(series.revenue), previous: prevRevenue, format: 'money', currency: input.currency, upIsGood: true, trend: series.revenue, href: '/admin/payments' },
    { key: 'shortlist', label: 'Shortlist rate', value: rate(currentApps), previous: prevApps.length ? rate(prevApps) : null, format: 'percent', upIsGood: true, trend: [] },
    { key: 'response', label: 'Median time to first response', value: responseHours(currentApps) ?? 0, previous: responseHours(prevApps), format: 'hours', upIsGood: false, trend: [] },
  ];

  const funnel = PIPELINE.map((stage, i) => ({
    stage,
    reached: currentApps.filter((a) => {
      const at = a.status === 'hired' ? PIPELINE.indexOf('offer') : PIPELINE.indexOf(a.status);
      return at >= i;
    }).length,
  }));

  const jobs = new Map<string, { label: string; value: number }>();
  const roles = new Map<string, number>();
  const origins = new Map<string, number>();
  for (const a of currentApps) {
    const job = jobs.get(a.job_id) ?? { label: a.job_postings ? `${a.job_postings.title}, ${a.job_postings.city}` : 'Unknown job', value: 0 };
    job.value++;
    jobs.set(a.job_id, job);
    bump(roles, a.candidates?.position ? positionLabel(a.candidates.position) : 'Not given');
    bump(origins, stateOf(a.candidates?.city_state ?? null));
  }

  return {
    range,
    generatedAt: now.toISOString(),
    kpis,
    daily: days.map((date, i) => ({ date, applications: series.applications[i]!, signups: series.signups[i]!, payments: series.payments[i]! })),
    funnel,
    topJobs: [...jobs.entries()].map(([id, j]) => ({ id, ...j })).sort((a, b) => b.value - a.value).slice(0, 6),
    topRoles: topN(roles, 6),
    origins: topN(origins, 8),
    paymentMethods: topN(methods, 4),
    live,
  };
}

/**
 * What the dashboard shows before Supabase is connected: zeros, not invented
 * figures, so nobody mistakes a sample for the business.
 */
function emptyAnalytics(range: RangeDays, now: Date): Analytics {
  const days = emptyDays(range, now);
  const zeros = days.map(() => 0);
  const kpi = (key: string, label: string, format: Kpi['format'], upIsGood = true, href?: string): Kpi => ({ key, label, value: 0, previous: null, format, upIsGood, trend: zeros, href });
  return {
    range,
    generatedAt: now.toISOString(),
    kpis: [
      kpi('applications', 'Applications', 'count', true, '/admin/applications'),
      kpi('signups', 'New candidates', 'count', true, '/admin/cohorts'),
      kpi('paid', 'Packages paid', 'count', true, '/admin/payments'),
      kpi('revenue', 'Revenue', 'money', true, '/admin/payments'),
      kpi('shortlist', 'Shortlist rate', 'percent'),
      kpi('response', 'Median time to first response', 'hours', false),
    ],
    daily: days.map((date) => ({ date, applications: 0, signups: 0, payments: 0 })),
    funnel: PIPELINE.map((stage) => ({ stage, reached: 0 })),
    topJobs: [],
    topRoles: [],
    origins: [],
    paymentMethods: [],
    live: { openJobs: 0, awaitingReview: 0, interviewsActive: 0, offersOpen: 0 },
  };
}
