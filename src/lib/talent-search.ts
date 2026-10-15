import { SAMPLE_TALENT, cefrRank, type Cefr, type TalentRow } from '@/lib/data/candidates';
import type { SectorSlug } from '@/lib/data/sectors';
import { parseQuery } from '@/lib/assessment/query-parser';
import { getServerSupabase } from '@/lib/supabase/server';
import { maskName } from '@/lib/hiring/redact';

export type SearchFilters = {
  query?: string;
  sector?: SectorSlug;
  /** Minimum CEFR level. The filter chips offer A2+, B1+ and B2+. */
  minEnglish: Cefr;
  page: number;
  pageSize: number;
  /**
   * Shorten names to a first name and initial, except for candidates whose
   * identity we have released to this employer. On for every employer; staff
   * pass false.
   */
  maskNames: boolean;
};

export type SearchResult = {
  rows: TalentRow[];
  total: number;
  page: number;
  pageSize: number;
  /** True when the sample pool was used because Supabase is not configured. */
  sample: boolean;
};

/**
 * Talent-pool search.
 *
 * Filtering, sorting and pagination happen in Postgres when it is available, so
 * a pool of 20,000 candidates is not pulled into the request to be sorted in
 * JavaScript. The sample fallback exists so the screen is reviewable without
 * infrastructure.
 *
 * `visible_to_employers` is enforced here as well as in RLS: a candidate who
 * hid their profile must not appear, and that promise is in the FAQ.
 */
export async function searchTalent(filters: SearchFilters): Promise<SearchResult> {
  const parsed = filters.query ? parseQuery(filters.query) : undefined;
  const sector = filters.sector ?? parsed?.sector;
  const minEnglish = filters.minEnglish;
  const minYears = parsed?.minYears;

  const supabase = await getServerSupabase();

  if (!supabase) {
    const rows = SAMPLE_TALENT.filter(
      (row) =>
        (!sector || row.sector === sector) &&
        cefrRank(row.english) >= cefrRank(minEnglish) &&
        (minYears === undefined || row.yearsExperience >= minYears),
    ).sort((a, b) => b.score - a.score);

    const start = (filters.page - 1) * filters.pageSize;
    return {
      rows: rows.slice(start, start + filters.pageSize).map((row) => (filters.maskNames ? { ...row, name: maskName(row.name) } : row)),
      total: rows.length,
      page: filters.page,
      pageSize: filters.pageSize,
      sample: true,
    };
  }

  let request = supabase
    .from('talent_pool')
    .select('id, full_name, city_state, sector, english_cefr, overall_score, years_experience, has_voice_intro', {
      count: 'exact',
    })
    .eq('visible_to_employers', true)
    .gte('english_rank', cefrRank(minEnglish))
    .order('overall_score', { ascending: false });

  if (sector) request = request.eq('sector', sector);
  if (minYears !== undefined) request = request.gte('years_experience', minYears);

  const from = (filters.page - 1) * filters.pageSize;
  const { data, count, error } = await request.range(from, from + filters.pageSize - 1);

  if (error) {
    console.error('[search] query failed', error);
    return { rows: [], total: 0, page: filters.page, pageSize: filters.pageSize, sample: false };
  }

  /* Released identities, read through RLS: an employer sees only its own approvals. */
  let released = new Set<string>();
  if (filters.maskNames && data?.length) {
    const { data: unlocks } = await supabase
      .from('profile_unlock_requests')
      .select('candidate_id')
      .eq('status', 'approved')
      .in('candidate_id', data.map((row) => row.id as string));
    released = new Set((unlocks ?? []).map((u) => String(u.candidate_id)));
  }

  const rows: TalentRow[] = (data ?? []).map((row) => ({
    id: row.id as string,
    name: filters.maskNames && !released.has(row.id as string) ? maskName(row.full_name as string) : (row.full_name as string),
    city: row.city_state as string,
    sector: row.sector as SectorSlug,
    english: row.english_cefr as Cefr,
    score: row.overall_score as number,
    yearsExperience: row.years_experience as number,
    hasVoiceIntro: Boolean(row.has_voice_intro),
  }));

  return { rows, total: count ?? rows.length, page: filters.page, pageSize: filters.pageSize, sample: false };
}
