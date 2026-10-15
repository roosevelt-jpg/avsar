import Link from 'next/link';
import { AdminButton, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { StatCard } from '@/components/admin/analytics/StatCard';
import { TrendChart } from '@/components/admin/analytics/TrendChart';
import { Funnel } from '@/components/admin/analytics/Funnel';
import { BarList } from '@/components/admin/analytics/BarList';
import { LiveUpdates } from '@/components/admin/analytics/LiveUpdates';
import { listApplicationsForConsole, listUpcomingInterviews, type AdminApplicationRow, type UpcomingInterview } from '@/lib/applications/data';
import { interviewTimes } from '@/lib/interviews/time';
import { STATUS_META } from '@/lib/applications/status';
import { getAnalytics, parseRange, RANGES } from '@/lib/console/analytics';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Console' };
export const dynamic = 'force-dynamic';

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-[16px] font-semibold">{title}</h2>
        {note ? <span className="text-[12px] text-muted">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * The console's front page: live counts of what needs attention now, KPIs
 * with change vs the previous period, daily trends, the hiring funnel, and
 * where applications come from. One date range scopes everything below it,
 * and the page refreshes itself as candidates apply and pay.
 *
 * Each card shows only if the viewer's role can see the data behind it.
 */
export default async function ConsoleDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const access = await requirePermission('dashboard.view', '/admin/dashboard');
  const range = parseRange((await searchParams).range);

  const showApps = can(access, 'applications.view');
  const showMoney = can(access, 'payments.view');
  const showJobs = can(access, 'jobs.view');

  const [analytics, recent, interviews] = await Promise.all([
    getAnalytics(range),
    showApps ? listApplicationsForConsole({}) : Promise.resolve({ rows: [] as AdminApplicationRow[], total: 0, pageSize: 0 }),
    showApps ? listUpcomingInterviews() : Promise.resolve([] as UpcomingInterview[]),
  ]);

  const kpis = analytics.kpis.filter((kpi) => {
    if (kpi.key === 'paid' || kpi.key === 'revenue') return showMoney;
    if (kpi.key === 'applications' || kpi.key === 'shortlist' || kpi.key === 'response') return showApps;
    return can(access, 'candidates.view');
  });

  const now = [
    showApps && { label: 'Waiting for review', value: analytics.live.awaitingReview, href: '/admin/applications?status=submitted', urgent: analytics.live.awaitingReview > 0 },
    showApps && { label: 'In interview', value: analytics.live.interviewsActive, href: '/admin/applications?status=interview', urgent: false },
    showApps && { label: 'Offers out', value: analytics.live.offersOpen, href: '/admin/applications?status=offer', urgent: false },
    showJobs && { label: 'Live jobs', value: analytics.live.openJobs, href: '/admin/jobs?status=published', urgent: false },
  ].filter(Boolean) as { label: string; value: number; href: string; urgent: boolean }[];

  const totalPaid = analytics.paymentMethods.reduce((a, r) => a + r.value, 0);

  return (
    <AdminShell current="/admin/dashboard" isStaff>
      <AdminHeading
        title="Dashboard"
        lead="What needs attention now, and how recruitment is going. Every number opens the list behind it."
        actions={
          <>
            {can(access, 'jobs.edit') && <AdminButton href="/admin/jobs/new">Post a job</AdminButton>}
            {can(access, 'cms.edit') && <AdminButton href="/admin/cms" variant="light">Edit website</AdminButton>}
          </>
        }
      />

      {/* One row of filters, above everything it scopes. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Date range" className="flex rounded-full border border-line bg-surface p-1 text-[13px]">
          {RANGES.map((r) =>
            r === range ? (
              <span key={r} aria-current="true" className="rounded-full bg-ink px-3 py-1 text-paper">Last {r} days</span>
            ) : (
              <Link key={r} href={`/admin/dashboard?range=${r}`} className="rounded-full px-3 py-1 text-ink-2 no-underline hover:text-ink">
                Last {r} days
              </Link>
            ),
          )}
        </nav>
        <LiveUpdates generatedAt={analytics.generatedAt} />
      </div>

      {now.length > 0 && (
        <section aria-label="Right now" className="mt-5">
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4">
            {now.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`t-colors flex h-full items-center justify-between gap-3 rounded-[16px] border px-4 py-3 no-underline ${
                    item.urgent ? 'border-accent bg-accent-tint' : 'border-line bg-surface hover:border-line-strong'
                  }`}
                >
                  <span className="text-[13px] text-ink-2">{item.label}</span>
                  <span className="text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-ink">{item.value.toLocaleString('en-IN')}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {kpis.length > 0 && (
        <ul className="m-0 mt-3 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {kpis.map((kpi) => (
            <li key={kpi.key}>
              <StatCard kpi={kpi} range={range} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Daily activity" note={`Last ${range} days`}>
          <TrendChart daily={analytics.daily} />
        </Panel>
        {showApps && (
          <Panel title="Hiring funnel" note="This period's applications, by furthest stage">
            <Funnel stages={analytics.funnel} />
          </Panel>
        )}
      </div>

      {showApps && interviews.length > 0 && (
        <div className="mt-4">
          <Panel title="Upcoming interviews" note="India time, Lisbon in brackets">
            <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 md:grid-cols-2 xl:grid-cols-3">
              {interviews.map((interview) => (
                <li key={interview.id}>
                  <Link href={`/admin/applications/${interview.applicationId}`} className="block rounded-[12px] bg-paper px-4 py-3 text-ink no-underline hover:text-employer">
                    <span className="block text-[14px] font-medium">{interview.candidateName}</span>
                    <span className="block text-[12px] text-muted">{interview.jobTitle}</span>
                    <span className="mt-1 block text-[13px] text-ink-2">{interviewTimes(interview.startsAt).both}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      {showApps && (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Panel title="Most applied-for jobs">
            <BarList rows={analytics.topJobs.map((j) => ({ label: j.label, value: j.value, href: `/admin/applications?job=${j.id}` }))} />
          </Panel>
          <Panel title="Applications by role">
            <BarList rows={analytics.topRoles} />
          </Panel>
          <Panel title="Where applicants are from" note="Indian state">
            <BarList rows={analytics.origins} />
          </Panel>
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {showMoney && (
          <Panel title="How candidates pay" note={totalPaid ? `${totalPaid.toLocaleString('en-IN')} payments` : undefined}>
            <BarList
              rows={analytics.paymentMethods.map((m) => ({ label: m.label === 'NETBANKING' ? 'Net banking' : m.label === 'CARD' ? 'Card' : m.label, value: m.value }))}
              suffix={(row) => (totalPaid ? `${Math.round((row.value / totalPaid) * 100)}%` : '')}
              empty="No payments in this period yet."
            />
          </Panel>
        )}
        {showApps && (
          <Panel title="Latest activity">
            {recent.rows.length === 0 ? (
              <p className="m-0 text-[14px] text-muted">No applications yet. They appear here as soon as candidates apply.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
                {recent.rows.slice(0, 7).map((row) => (
                  <li key={row.id}>
                    <Link href={`/admin/applications/${row.id}`} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-ink no-underline hover:text-employer">
                      <span>
                        <span className="block text-[14px] font-medium">{row.candidate.fullName}</span>
                        <span className="block text-[12px] text-muted">
                          {row.job.title} · {row.job.city} · {new Date(row.statusChangedAt).toLocaleDateString('en-GB')}
                        </span>
                      </span>
                      <Pill tone={STATUS_META[row.status].tone === 'success' ? 'success' : row.status === 'submitted' ? 'accent' : 'neutral'}>
                        {STATUS_META[row.status].label}
                      </Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </AdminShell>
  );
}
