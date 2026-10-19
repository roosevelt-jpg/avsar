import { getServerSupabase } from '@/lib/supabase/server';
import { jobFromRow, type Job } from '@/lib/jobs/types';

/** Ids of the jobs this candidate saved. Read through the session client, so RLS scopes it. */
export async function savedJobIds(candidateId: string | null): Promise<Set<string>> {
  if (!candidateId) return new Set();
  const supabase = await getServerSupabase();
  if (!supabase) return new Set();
  const { data } = await supabase.from('saved_jobs').select('job_id').eq('candidate_id', candidateId);
  return new Set((data ?? []).map((row) => String(row.job_id)));
}

/** Saved jobs that are still published, newest save first. */
export async function listSavedJobs(candidateId: string | null): Promise<Job[]> {
  if (!candidateId) return [];
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('created_at, job_postings!inner (*)')
    .eq('candidate_id', candidateId)
    .eq('job_postings.status', 'published')
    .order('created_at', { ascending: false })
    .limit(12);
  if (error) {
    console.error('[saved-jobs] list failed', error);
    return [];
  }
  return (data ?? []).map((row) => {
    const job = (row as Record<string, unknown>).job_postings;
    return jobFromRow((Array.isArray(job) ? job[0] : job) as Record<string, unknown>);
  });
}
