import { getAnonSupabase } from '@/lib/supabase/anon';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { SAMPLE_JOBS } from './sample';
import { jobFromRow, type Job, type JobStatus } from './types';

/**
 * Reading job postings.
 *
 * Public reads use the anon client, so RLS (`jobs_public_read`) is what decides
 * a draft never reaches the board, and so the pages can be cached without a
 * session cookie in the way. Console reads use the service role after the
 * caller has checked `jobs.view`.
 */

export type JobFilters = {
  q?: string;
  area?: string;
  city?: string;
  position?: string;
  page?: number;
  pageSize?: number;
};

export type JobPage = { jobs: Job[]; total: number; page: number; pageSize: number };

const LIST_COLUMNS = '*';

function matchesSample(job: Job, filters: JobFilters): boolean {
  const q = filters.q?.trim().toLowerCase();
  if (q && !`${job.title} ${job.city} ${job.summary} ${job.employerDisplay}`.toLowerCase().includes(q)) return false;
  if (filters.area && job.area !== filters.area) return false;
  if (filters.city && job.city.toLowerCase() !== filters.city.toLowerCase()) return false;
  if (filters.position && job.positionSlug !== filters.position) return false;
  return true;
}

export async function listPublishedJobs(filters: JobFilters = {}): Promise<JobPage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));

  if (!isSupabaseConfigured()) {
    const all = SAMPLE_JOBS.filter((job) => matchesSample(job, filters));
    return { jobs: all.slice((page - 1) * pageSize, page * pageSize), total: all.length, page, pageSize };
  }

  const supabase = getAnonSupabase();
  if (!supabase) return { jobs: [], total: 0, page, pageSize };

  let query = supabase
    .from('job_postings')
    .select(LIST_COLUMNS, { count: 'exact' })
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.q?.trim()) {
    /* websearch syntax tolerates whatever a candidate types: quotes, minus
       signs, stray punctuation, without throwing a syntax error. */
    query = query.textSearch('search', filters.q.trim(), { type: 'websearch', config: 'simple' });
  }
  if (filters.area) query = query.eq('area', filters.area);
  if (filters.city) query = query.ilike('city', filters.city);
  if (filters.position) query = query.eq('position_slug', filters.position);

  const { data, count, error } = await query;
  if (error) {
    console.error('[jobs] list failed', error);
    return { jobs: [], total: 0, page, pageSize };
  }
  return { jobs: (data ?? []).map((row) => jobFromRow(row as Record<string, unknown>)), total: count ?? 0, page, pageSize };
}

/**
 * Every live posting's slug and last edit, for the sitemap. Paged, because a
 * sitemap that silently stops at the first page hides the newest jobs from
 * search engines exactly when there are most of them.
 */
export async function listPublishedJobSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  if (!isSupabaseConfigured()) return SAMPLE_JOBS.map((job) => ({ slug: job.slug, updatedAt: job.updatedAt }));
  const supabase = getAnonSupabase();
  if (!supabase) return [];

  const PAGE = 1000;
  const out: { slug: string; updatedAt: string }[] = [];
  for (let from = 0; from < 20 * PAGE; from += PAGE) {
    const { data, error } = await supabase
      .from('job_postings')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error('[jobs] sitemap list failed', error);
      break;
    }
    out.push(...(data ?? []).map((row) => ({ slug: String(row.slug), updatedAt: String(row.updated_at) })));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export async function getPublishedJob(slug: string): Promise<Job | null> {
  if (!isSupabaseConfigured()) return SAMPLE_JOBS.find((job) => job.slug === slug) ?? null;
  const supabase = getAnonSupabase();
  const { data, error } = (await supabase?.from('job_postings').select('*').eq('slug', slug).maybeSingle()) ?? {
    data: null,
    error: null,
  };
  if (error) console.error('[jobs] get failed', error);
  return data ? jobFromRow(data as Record<string, unknown>) : null;
}

export async function listFeaturedJobs(limit = 6): Promise<Job[]> {
  const { jobs } = await listPublishedJobs({ pageSize: limit });
  return jobs;
}

/** Same position first, then anything else open, for the dashboard. */
export async function recommendedJobs(position: string | null, excludeIds: string[], limit = 3): Promise<Job[]> {
  const pool = position ? (await listPublishedJobs({ position, pageSize: 12 })).jobs : [];
  const rest = (await listPublishedJobs({ pageSize: 12 })).jobs;
  const seen = new Set(excludeIds);
  const out: Job[] = [];
  for (const job of [...pool, ...rest]) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    out.push(job);
    if (out.length >= limit) break;
  }
  return out;
}

/** Distinct cities with an open posting, for the filter. */
export async function openCities(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [...new Set(SAMPLE_JOBS.map((job) => job.city))].sort();
  const supabase = getAnonSupabase();
  const { data } = (await supabase?.from('job_postings').select('city').eq('status', 'published').limit(500)) ?? {
    data: null,
  };
  return [...new Set<string>((data ?? []).map((row: { city: string }) => String(row.city)))].sort();
}

// ------------------------------------------------------------------ console

export type AdminJobRow = Job & {
  pipeline: { total: number; submitted: number; inProgress: number; offers: number };
  /** Set when the posting began as an employer's vacancy request. */
  requestedAt: string | null;
};

/** `requests` lists postings that began as an employer's vacancy request, in any status. */
export async function listAllJobs(status?: JobStatus | 'all' | 'requests'): Promise<AdminJobRow[]> {
  const empty = { total: 0, submitted: 0, inProgress: 0, offers: 0 };
  if (!isSupabaseConfigured()) {
    /* The first sample stands in for a request, so the label and the filter
       can be seen without a database. */
    const rows = SAMPLE_JOBS.map((job, index) => ({
      ...job,
      pipeline: { ...empty, total: 12 - index * 2, submitted: 4 - (index % 3) },
      requestedAt: index === 0 ? '2026-09-22T10:40:00.000Z' : null,
    }));
    return status === 'requests' ? rows.filter((row) => row.requestedAt) : rows;
  }
  const admin = getAdminSupabase();
  if (!admin) return [];

  let query = admin.from('job_postings').select('*').order('updated_at', { ascending: false }).limit(500);
  if (status === 'requests') query = query.not('requested_at', 'is', null);
  else if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) {
    console.error('[jobs] admin list failed', error);
    return [];
  }
  const jobs = (data ?? []).map((row) => ({
    ...jobFromRow(row as Record<string, unknown>),
    requestedAt: ((row as Record<string, unknown>).requested_at as string | null) ?? null,
  }));

  const { data: pipeline } = await admin.from('job_pipeline').select('*');
  const byJob = new Map(
    (pipeline ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return [
        String(r.job_id),
        {
          total: Number(r.total ?? 0),
          submitted: Number(r.submitted ?? 0),
          inProgress: Number(r.in_progress ?? 0),
          offers: Number(r.offers ?? 0),
        },
      ] as const;
    }),
  );
  return jobs.map((job) => ({ ...job, pipeline: byJob.get(job.id) ?? empty }));
}

export async function getJobById(id: string): Promise<Job | null> {
  if (!isSupabaseConfigured()) return SAMPLE_JOBS.find((job) => job.id === id) ?? null;
  const admin = getAdminSupabase();
  const { data } = (await admin?.from('job_postings').select('*').eq('id', id).maybeSingle()) ?? { data: null };
  return data ? jobFromRow(data as Record<string, unknown>) : null;
}
