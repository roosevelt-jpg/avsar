import Link from 'next/link';
import { AdminButton, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { Mono } from '@/components/ui/Mono';
import { applicationCounts, listApplicationsForConsole, type AdminApplicationRow } from '@/lib/applications/data';
import { STATUS_META, type ApplicationStatus } from '@/lib/applications/status';
import { listAllJobs, type AdminJobRow } from '@/lib/jobs/data';
import { can, requirePermission } from '@/lib/rbac/server';
import { consoleMetrics } from '@/lib/console/metrics';

export const metadata = { title: 'Console' };

/**
 * The console's front page: what needs attention today.
 *
 * Every tile links to the screen where the work is done, and only shows if
 * the viewer can act on it.
 */
export default async function ConsoleDashboard() {
  const access = await requirePermission('dashboard.view', '/admin/dashboard');

  const showApps = can(access, 'applications.view');
  const showJobs = can(access, 'jobs.view');
  const showMoney = can(access, 'payments.view');

  const [counts, recent, jobs, metrics] = await Promise.all([
    showApps ? applicationCounts() : Promise.resolve<Record<string, number>>({}),
    showApps ? listApplicationsForConsole({}) : Promise.resolve({ rows: [] as AdminApplicationRow[], total: 0, pageSize: 0 }),
    showJobs ? listAllJobs('all') : Promise.resolve([] as AdminJobRow[]),
    consoleMetrics(),
  ]);

  const published = jobs.filter((job) => job.status === 'published');
  const drafts = jobs.filter((job) => job.status === 'draft');
  const newApps = counts.submitted ?? 0;
  const inPipeline = (counts.screening ?? 0) + (counts.shortlisted ?? 0) + (counts.interview ?? 0);
  const offers = (counts.offer ?? 0) + (counts.hired ?? 0) + (counts.visa_processing ?? 0);

  const tiles = [
    showApps && { label: 'New applications', value: newApps, note: 'waiting for a first look', href: '/admin/applications?status=submitted', tone: newApps ? 'accent' : 'plain' },
    showApps && { label: 'In the pipeline', value: inPipeline, note: 'screening, shortlist, interview', href: '/admin/applications', tone: 'plain' },
    showApps && { label: 'Offers and visas', value: offers, note: 'offer, hired, visa processing', href: '/admin/applications?status=offer', tone: 'plain' },
    showJobs && { label: 'Live jobs', value: published.length, note: `${drafts.length} drafts`, href: '/admin/jobs', tone: 'plain' },
    { label: 'Candidates', value: metrics.candidates, note: `${metrics.candidatesWeek} joined this week`, href: '/admin/cohorts', tone: 'plain' },
    showMoney && { label: 'Assessments paid', value: metrics.paid, note: 'all time', href: '/admin/payments', tone: 'plain' },
  ].filter(Boolean) as { label: string; value: number; note: string; href: string; tone: string }[];

  return (
    <AdminShell current="/admin/dashboard" isStaff>
      <AdminHeading
        title="Good to see you"
        lead="What needs attention today. Every number opens the list behind it."
        actions={
          <>
            {can(access, 'jobs.edit') && <AdminButton href="/admin/jobs/new">Post a job</AdminButton>}
            {can(access, 'cms.edit') && <AdminButton href="/admin/cms" variant="light">Edit website</AdminButton>}
          </>
        }
      />

      <ul className="m-0 mt-8 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 p-0">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link
              href={tile.href}
              className={`t-colors block h-full rounded-[18px] border p-5 no-underline ${
                tile.tone === 'accent' ? 'border-accent bg-accent-tint' : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <Mono className="text-muted">{tile.label}</Mono>
              <p className="m-0 mt-2 text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">{tile.value.toLocaleString('en-IN')}</p>
              <p className="m-0 mt-2 text-[13px] text-muted">{tile.note}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {showApps && (
          <section className="rounded-[20px] border border-line bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-[18px] font-semibold">Latest activity</h2>
              <Link href="/admin/applications" className="prose-link text-[14px]">All applications</Link>
            </div>
            {recent.rows.length === 0 ? (
              <p className="m-0 text-[14px] text-muted">No applications yet. They appear here as soon as candidates apply.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
                {recent.rows.slice(0, 8).map((row) => (
                  <li key={row.id}>
                    <Link href={`/admin/applications/${row.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-ink no-underline hover:text-employer">
                      <span>
                        <span className="block text-[15px] font-medium">{row.candidate.fullName}</span>
                        <span className="block text-[13px] text-muted">
                          {row.job.title} · {row.job.city}
                        </span>
                      </span>
                      <Pill tone={STATUS_META[row.status as ApplicationStatus].tone === 'success' ? 'success' : row.status === 'submitted' ? 'accent' : 'neutral'}>
                        {STATUS_META[row.status as ApplicationStatus].label}
                      </Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {showJobs && (
          <section className="rounded-[20px] border border-line bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-[18px] font-semibold">Jobs by applications</h2>
              <Link href="/admin/jobs" className="prose-link text-[14px]">All jobs</Link>
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {[...published]
                .sort((a, b) => b.pipeline.total - a.pipeline.total)
                .slice(0, 6)
                .map((job) => {
                  const max = Math.max(1, ...published.map((j) => j.pipeline.total));
                  return (
                    <li key={job.id}>
                      <div className="mb-1 flex justify-between gap-3 text-[14px]">
                        <Link href={`/admin/jobs/${job.id}`} className="truncate text-ink no-underline hover:text-employer">{job.title}, {job.city}</Link>
                        <Mono className="text-muted">{job.pipeline.total}</Mono>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-line-soft">
                        <div className="h-full rounded-full bg-employer" style={{ width: `${(job.pipeline.total / max) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              {published.length === 0 && <li className="text-[14px] text-muted">No live jobs. Publish one from the Jobs screen.</li>}
            </ul>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
