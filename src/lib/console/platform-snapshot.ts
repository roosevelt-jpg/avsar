import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Live platform totals for the super-admin home hero strip. Service role only;
 * callers must already have passed requirePermission('dashboard.view').
 */
export type PlatformSnapshot = {
  candidates: number;
  employers: number;
  activeJobs: number;
  applications: number;
  interviews: number;
  hires: number;
  /** Share of candidates with an open (non-stopped) application, 0–100. */
  inProcessPct: number;
  hiredPct: number;
  visiblePct: number;
  integrationsConfigured: boolean;
};

export async function getPlatformSnapshot(): Promise<PlatformSnapshot> {
  const empty: PlatformSnapshot = {
    candidates: 0,
    employers: 0,
    activeJobs: 0,
    applications: 0,
    interviews: 0,
    hires: 0,
    inProcessPct: 0,
    hiredPct: 0,
    visiblePct: 0,
    integrationsConfigured: false,
  };
  if (!isSupabaseConfigured()) return empty;
  const admin = getAdminSupabase();
  if (!admin) return empty;

  const [candidates, employers, jobs, apps, interviews, hires, visible, inProcess] = await Promise.all([
    admin.from('candidates').select('id', { count: 'exact', head: true }),
    admin.from('employers').select('id', { count: 'exact', head: true }),
    admin.from('job_postings').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    admin.from('applications').select('id', { count: 'exact', head: true }),
    admin.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'interview'),
    admin
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['hired', 'visa_processing', 'relocated']),
    admin.from('candidates').select('id', { count: 'exact', head: true }).eq('visible_to_employers', true),
    admin
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'screening', 'shortlisted', 'interview', 'offer']),
  ]);

  const totalCandidates = candidates.count ?? 0;
  const hiredCount = hires.count ?? 0;
  const inProcessCount = inProcess.count ?? 0;
  const visibleCount = visible.count ?? 0;

  return {
    candidates: totalCandidates,
    employers: employers.count ?? 0,
    activeJobs: jobs.count ?? 0,
    applications: apps.count ?? 0,
    interviews: interviews.count ?? 0,
    hires: hiredCount,
    inProcessPct: totalCandidates ? Math.round((inProcessCount / totalCandidates) * 100) : 0,
    hiredPct: totalCandidates ? Math.round((hiredCount / totalCandidates) * 100) : 0,
    visiblePct: totalCandidates ? Math.round((visibleCount / totalCandidates) * 100) : 0,
    integrationsConfigured: Boolean(process.env.INTEGRATIONS_MASTER_KEY),
  };
}
