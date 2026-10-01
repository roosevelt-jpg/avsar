import { Mono } from '@/components/ui/Mono';
import { AdminShell, AdminHeading } from '@/components/employer/AdminShell';
import { requireStaff } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { COHORT } from '@/lib/data/cohort';
import { SELECTION_FUNNEL } from '@/lib/data/brand';

export const metadata = { title: 'Cohorts' };

/**
 * The funnel, counted.
 *
 * Every number here is read from the database rather than configured, because
 * the published rate and the stages under it are the one claim the product
 * makes about outcomes. If what the landing page says and what this screen
 * counts ever diverge, this screen is the one that is right, and somebody
 * needs to see that rather than discover it in a complaint.
 */
export default async function CohortsPage() {
  if (isSupabaseConfigured()) await requireStaff('/admin/cohorts');

  const admin = getAdminSupabase();

  /* `eq` is optional, so the filter is a column/value pair rather than a
     builder callback: typing the builder across both shapes buys nothing here. */
  const count = async (table: string, column?: string, value?: string): Promise<number> => {
    if (!admin) return 0;
    let query = admin.from(table).select('*', { count: 'exact', head: true });
    if (column && value !== undefined) query = query.eq(column, value);
    const { count: total, error } = await query;
    if (error) console.error('[cohorts] count failed', table, error.message);
    return total ?? 0;
  };

  const [registered, paid, assessed, shortlisted, placed] = await Promise.all([
    count('candidates'),
    count('candidates', 'payment_status', 'paid'),
    count('reports'),
    count('shortlist_entries'),
    count('placements', 'state', 'started'),
  ]);

  /* The rate the site publishes, next to the one this cohort has produced. A
     denominator of zero is shown as such rather than as a flattering dash. */
  const actualRate = shortlisted > 0 ? Math.round((placed / shortlisted) * 100) : null;

  const stages: [string, number, string][] = [
    ['Registered', registered, 'Opened an account'],
    ['Paid', paid, 'Completed checkout'],
    ['Assessed', assessed, 'Has a skills report'],
    ['Shortlisted by an employer', shortlisted, 'Kept by at least one employer'],
    ['Started work', placed, 'Placement reached "started"'],
  ];

  return (
    <AdminShell current="/admin/cohorts" isStaff suffix="cohorts">
      <AdminHeading
        title={COHORT.name}
        lead={`${COHORT.corridor}. Closes ${new Date(COHORT.closesAt).toLocaleDateString('en-GB')}, reviewed until ${new Date(COHORT.reviewUntil).toLocaleDateString('en-GB')}, announced ${new Date(COHORT.announceAt).toLocaleDateString('en-GB')}.`}
      />

      <div className="mt-8 grid max-w-[900px] gap-px overflow-hidden rounded-[14px] border border-line bg-line">
        {stages.map(([label, value, note]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 bg-surface px-5 py-4">
            <span>
              <span className="block text-[15px] font-medium">{label}</span>
              <span className="block text-[13px] text-muted">{note}</span>
            </span>
            <span className="font-mono text-[22px] tabular-nums">{value.toLocaleString('en-GB')}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 max-w-[900px] rounded-[14px] border border-line bg-surface-subtle px-5 py-4">
        <Mono className="text-muted">PRESENTED TO HIRED</Mono>
        <p className="mt-2 mb-0 text-[15px] leading-[1.6] text-ink-2">
          The site publishes <strong className="text-ink">{SELECTION_FUNNEL.presentedToHirePercent}%</strong>.
          {actualRate === null
            ? ' This cohort has nobody shortlisted yet, so there is no rate to compare it with.'
            : ` This cohort is at ${actualRate}%, from ${placed} started out of ${shortlisted} shortlisted.`}
        </p>
        <p className="mt-2 mb-0 text-[13px] leading-[1.6] text-muted">
          {SELECTION_FUNNEL.basis}
        </p>
      </div>
    </AdminShell>
  );
}
