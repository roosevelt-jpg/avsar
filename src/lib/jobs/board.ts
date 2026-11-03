import { AREAS } from '@/lib/data/positions';
import { getFunnelStats } from '@/lib/stats/funnel';
import { listPublicEmployers } from '@/lib/employer/marks';
import { getAnonSupabase } from '@/lib/supabase/anon';
import { EMPLOYMENT_TYPES, type EmploymentType } from './types';

/**
 * Facets and live counts for the jobs board.
 *
 * Counts are read from published jobs and the public funnel — never typed in
 * as marketing numbers. Experience bands map onto min_experience_years.
 */

export const EXPERIENCE_BANDS = ['entry', 'mid', 'senior'] as const;
export type ExperienceBand = (typeof EXPERIENCE_BANDS)[number];

export function experienceBand(years: number): ExperienceBand {
  if (years <= 1) return 'entry';
  if (years <= 4) return 'mid';
  return 'senior';
}

export function experienceYearsFilter(band: ExperienceBand): { min: number; max: number } {
  if (band === 'entry') return { min: 0, max: 1 };
  if (band === 'mid') return { min: 2, max: 4 };
  return { min: 5, max: 40 };
}

export type JobBoardFacets = {
  areas: { slug: string; label: string; count: number }[];
  experience: { band: ExperienceBand; count: number }[];
  employment: { type: EmploymentType; count: number }[];
  salaryMin: number;
  salaryMax: number;
};

export type JobBoardStats = {
  vacancies: number;
  employers: number;
  placed: number;
};

type FacetRow = {
  area: string | null;
  employment_type: string | null;
  min_experience_years: number | null;
  salary_min_eur: number | null;
  salary_max_eur: number | null;
  salary_period: string | null;
};

export async function jobBoardFacets(): Promise<JobBoardFacets> {
  const empty: JobBoardFacets = {
    areas: AREAS.map((area) => ({ slug: area.slug, label: area.label, count: 0 })),
    experience: EXPERIENCE_BANDS.map((band) => ({ band, count: 0 })),
    employment: EMPLOYMENT_TYPES.map((type) => ({ type, count: 0 })),
    salaryMin: 800,
    salaryMax: 2500,
  };
  const supabase = getAnonSupabase();
  if (!supabase) return empty;

  const { data, error } = await supabase
    .from('job_postings')
    .select('area, employment_type, min_experience_years, salary_min_eur, salary_max_eur, salary_period')
    .eq('status', 'published')
    .limit(1000);
  if (error) {
    console.error('[jobs] facets failed', error);
    return empty;
  }

  const rows = (data ?? []) as FacetRow[];
  const areaCounts = new Map<string, number>();
  const expCounts: Record<ExperienceBand, number> = { entry: 0, mid: 0, senior: 0 };
  const empCounts = new Map<string, number>();
  let lowest = Number.POSITIVE_INFINITY;
  let highest = 0;

  for (const row of rows) {
    if (row.area) areaCounts.set(row.area, (areaCounts.get(row.area) ?? 0) + 1);
    const band = experienceBand(Number(row.min_experience_years ?? 0));
    expCounts[band] += 1;
    const emp = row.employment_type ?? 'full_time';
    empCounts.set(emp, (empCounts.get(emp) ?? 0) + 1);
    const period = row.salary_period ?? 'month';
    const min = row.salary_min_eur;
    const max = row.salary_max_eur ?? row.salary_min_eur;
    if (period === 'month' && min != null) {
      lowest = Math.min(lowest, min);
      if (max != null) highest = Math.max(highest, max);
    }
  }

  return {
    areas: AREAS.map((area) => ({ slug: area.slug, label: area.label, count: areaCounts.get(area.slug) ?? 0 })),
    experience: EXPERIENCE_BANDS.map((band) => ({ band, count: expCounts[band] })),
    employment: EMPLOYMENT_TYPES.map((type) => ({ type, count: empCounts.get(type) ?? 0 })),
    salaryMin: Number.isFinite(lowest) ? Math.max(0, Math.floor(lowest / 50) * 50) : 800,
    salaryMax: highest > 0 ? Math.ceil(highest / 50) * 50 : 2500,
  };
}

/** Live vacancy, employer and placement counts for the jobs hero strip. */
export async function jobBoardStats(): Promise<JobBoardStats> {
  const supabase = getAnonSupabase();
  const [vacancyRes, employers, funnel] = await Promise.all([
    supabase
      ? supabase.from('job_postings').select('id', { count: 'exact', head: true }).eq('status', 'published')
      : Promise.resolve({ count: 0, error: null }),
    listPublicEmployers(),
    getFunnelStats(),
  ]);
  if (vacancyRes.error) console.error('[jobs] vacancy count failed', vacancyRes.error);
  return {
    vacancies: vacancyRes.count ?? 0,
    employers: employers.length,
    placed: funnel.hired,
  };
}

export function parseListParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : value.split(',');
  return raw.map((item) => item.trim()).filter(Boolean);
}
