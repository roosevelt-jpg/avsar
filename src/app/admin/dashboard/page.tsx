import Link from 'next/link';
import { AdminShell, Pill } from '@/components/employer/AdminShell';
import { StatCard } from '@/components/admin/analytics/StatCard';
import { TrendChart } from '@/components/admin/analytics/TrendChart';
import { Funnel } from '@/components/admin/analytics/Funnel';
import { ConversionFunnel } from '@/components/admin/analytics/ConversionFunnel';
import { BarList } from '@/components/admin/analytics/BarList';
import { LiveUpdates } from '@/components/admin/analytics/LiveUpdates';
import {
  StaffDashHero,
  StaffPlatformHealth,
  StaffPlatformStatStrip,
  StaffQuickActions,
  StaffSystemInsights,
  growthFromKpis,
} from '@/components/admin/StaffDashboardOverview';
import { listApplicationsForConsole, listUpcomingInterviews, type AdminApplicationRow, type UpcomingInterview } from '@/lib/applications/data';
import { interviewTimes } from '@/lib/interviews/time';
import { STATUS_META } from '@/lib/applications/status';
import { getAnalytics, parseRange, RANGES } from '@/lib/console/analytics';
import { getPlatformSnapshot } from '@/lib/console/platform-snapshot';
import { workQueue } from '@/lib/console/due';
import { getSiteSettings } from '@/lib/cms/data';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Console' };
export const dynamic = 'force-dynamic';

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="motion-rise rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-[16px] font-semibold tracking-[-0.02em] text-[#142438]">{title}</h2>
        {note ? <span className="font-mono text-[11px] text-muted">{note}</span> : null}
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
  const showCandidates = can(access, 'candidates.view');

  const settings = await getSiteSettings();
  const [analytics, recent, interviews, queue, snapshot] = await Promise.all([
    getAnalytics(range),
    showApps ? listApplicationsForConsole({}) : Promise.resolve({ rows: [] as AdminApplicationRow[], total: 0, pageSize: 0 }),
    showApps ? listUpcomingInterviews() : Promise.resolve([] as UpcomingInterview[]),
    workQueue({
      userId: access.userId,
      responseDays: settings.hiring.responseDays,
      applications: showApps,
      leads: can(access, 'leads.manage'),
      relocation: can(access, 'relocation.manage'),
    }),
    getPlatformSnapshot(),
  ]);

  const kpis = analytics.kpis.filter((kpi) => {
    if (kpi.key === 'paid' || kpi.key === 'revenue') return showMoney;
    if (kpi.key === 'applications' || kpi.key === 'shortlist' || kpi.key === 'response') return showApps;
    return can(access, 'candidates.view');
  });

  const now = [
    showApps && { label: 'Waiting for review', value: analytics.live.awaitingReview, href: '/admin/applications?status=submitted', urgent: analytics.live.awaitingReview > 0 },
    showApps && { label: 'Late replies', value: queue.lateCount, href: '/admin/applications?late=1', urgent: queue.lateCount > 0 },
    showApps && { label: 'In interview', value: analytics.live.interviewsActive, href: '/admin/applications?status=interview', urgent: false },
    showApps && { label: 'Offers out', value: analytics.live.offersOpen, href: '/admin/applications?status=offer', urgent: false },
    showJobs && { label: 'Live jobs', value: analytics.live.openJobs, href: '/admin/jobs?status=published', urgent: false },
  ].filter(Boolean) as { label: string; value: number; href: string; urgent: boolean }[];

  const totalPaid = analytics.paymentMethods.reduce((a, r) => a + r.value, 0);

  /* Shortcuts to the jobs people come here to do, each shown only to a role
     that can do it. */
  const shortcuts = [
    can(access, 'jobs.edit') && { href: '/admin/jobs/new', label: 'Post a Job', note: 'Draft, then publish' },
    can(access, 'employers.manage') && { href: '/admin/employers', label: 'Add Employer', note: 'Company accounts' },
    can(access, 'candidates.view') && { href: '/admin', label: 'Add Candidate', note: 'Search the talent pool' },
    can(access, 'staff.manage') && { href: '/admin/staff', label: 'Create User', note: 'Invite console staff' },
    can(access, 'cms.edit') && { href: '/admin/cms', label: 'Manage Pages', note: 'Website CMS' },
    can(access, 'dashboard.view') && { href: '/admin/analysis', label: 'View Reports', note: 'Insights' },
    showApps && { href: '/admin/applications?status=submitted', label: 'Review applications', note: `${analytics.live.awaitingReview.toLocaleString('en-GB')} waiting` },
    can(access, 'leads.manage') && { href: '/admin/inbox', label: 'CRM', note: 'Leads and messages' },
    can(access, 'relocation.manage') && { href: '/admin/legal-reviews', label: 'Legal reviews', note: 'Package buyers' },
    showMoney && { href: '/admin/payments', label: 'Payments', note: 'Receipts and refunds' },
  ].filter(Boolean) as { href: string; label: string; note: string }[];

  const growthPct = growthFromKpis(analytics.kpis);

  return (
    <AdminShell current="/admin/dashboard" isStaff>
      <div className="flex flex-col gap-5">
        <StaffDashHero
          canPostJob={can(access, 'jobs.edit')}
          canAddEmployer={can(access, 'employers.manage')}
          canEditCms={can(access, 'cms.edit')}
        />
        <StaffPlatformStatStrip snapshot={snapshot} growthPct={growthPct} />
      </div>

      {/* Attention queue first: the reason staff open the console. */}
      {now.length > 0 && (
        <section aria-label="Right now" className="motion-rise mt-7">
          <p className="m-0 mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Needs attention</p>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-5">
            {now.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`t-colors motion-row flex h-full flex-col justify-between gap-3 rounded-[14px] border px-4 py-4 no-underline ${
                    item.urgent
                      ? 'border-[#b28a49]/50 bg-[#b28a49]/12 shadow-[0_12px_28px_-20px_rgba(178,138,73,0.55)]'
                      : 'border-[#142438]/08 bg-white hover:border-[#b28a49]/40'
                  }`}
                >
                  <span className="text-[13px] text-ink-2">{item.label}</span>
                  <span className="text-[28px] font-semibold tabular-nums tracking-[-0.03em] text-[#142438]">
                    {item.value.toLocaleString('en-GB')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(queue.due.length > 0 || queue.mine.length > 0) && (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <Panel title="Due today" note="Oldest first">
            {queue.due.length === 0 ? (
              <p className="m-0 text-[14px] text-muted">Nothing is due. New applications, messages and documents will show here.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
                {queue.due.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="flex items-start justify-between gap-3 py-2.5 text-ink no-underline hover:text-employer">
                      <span>
                        <span className="block text-[14px] font-medium">{item.title}</span>
                        <span className="block text-[12px] text-muted">{item.detail}</span>
                      </span>
                      <span className={`shrink-0 text-[12px] ${item.tone === 'overdue' ? 'font-medium text-accent-deep' : 'text-muted'}`}>
                        {item.tone === 'overdue' ? 'Late' : item.tone === 'today' ? 'Today' : 'Waiting'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 mb-0 text-[13px]">
              <Link href="/admin/analysis" className="text-ink underline">
                Read this week&apos;s numbers
              </Link>
            </p>
          </Panel>
          {showApps && (
            <Panel title="Yours" note="Files you have taken">
              {queue.mine.length === 0 ? (
                <p className="m-0 text-[14px] text-muted">You have not taken a file. Open an application and press Take it.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
                  {queue.mine.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href} className="flex items-start justify-between gap-3 py-2.5 text-ink no-underline hover:text-employer">
                        <span>
                          <span className="block text-[14px] font-medium">{item.title}</span>
                          <span className="block text-[12px] text-muted">{item.detail || 'No next step yet'}</span>
                        </span>
                        {item.late ? <span className="shrink-0 text-[12px] font-medium text-accent-deep">Late</span> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Date range" className="flex rounded-full border border-line/80 bg-surface p-1 text-[13px]">
          {RANGES.map((r) =>
            r === range ? (
              <span key={r} aria-current="true" className="rounded-full bg-ink px-3 py-1 text-paper">
                Last {r} days
              </span>
            ) : (
              <Link
                key={r}
                href={`/admin/dashboard?range=${r}`}
                className="rounded-full px-3 py-1 text-ink-2 no-underline hover:text-ink"
              >
                Last {r} days
              </Link>
            ),
          )}
        </nav>
        <LiveUpdates generatedAt={analytics.generatedAt} />
      </div>

      {kpis.length > 0 && (
        <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {kpis.map((kpi) => (
            <li key={kpi.key}>
              <StatCard kpi={kpi} range={range} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <Panel title="Applications & hiring trend" note={`Last ${range} days`}>
          <TrendChart daily={analytics.daily} />
        </Panel>
        {showApps ? (
          <Panel title="Hiring funnel" note="This period's applications, by furthest stage">
            <Funnel stages={analytics.funnel} />
          </Panel>
        ) : (
          <div />
        )}
        <StaffQuickActions items={shortcuts.slice(0, 6)} />
      </div>

      {showCandidates && (
        <div className="mt-4">
          <Panel title="Conversion" note="People who registered in this period">
            <ConversionFunnel stages={analytics.conversion} />
          </Panel>
        </div>
      )}

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

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        {showApps ? (
          <Panel title="Recent activity">
            {recent.rows.length === 0 ? (
              <p className="m-0 text-[14px] text-muted">No applications yet. They appear here as soon as candidates apply.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
                {recent.rows.slice(0, 7).map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/admin/applications/${row.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-ink no-underline hover:text-[#b28a49]"
                    >
                      <span>
                        <span className="block text-[14px] font-medium">{row.candidate.fullName}</span>
                        <span className="block text-[12px] text-muted">
                          {row.job.title} · {row.job.city} ·{' '}
                          {new Date(row.statusChangedAt).toLocaleDateString('en-GB')}
                        </span>
                      </span>
                      <Pill
                        tone={
                          STATUS_META[row.status].tone === 'success'
                            ? 'success'
                            : row.status === 'submitted'
                              ? 'accent'
                              : 'neutral'
                        }
                      >
                        {STATUS_META[row.status].label}
                      </Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : showMoney ? (
          <Panel title="How candidates pay" note={totalPaid ? `${totalPaid.toLocaleString('en-GB')} payments` : undefined}>
            <BarList
              rows={analytics.paymentMethods.map((m) => ({
                label: m.label === 'NETBANKING' ? 'Net banking' : m.label === 'CARD' ? 'Card' : m.label,
                value: m.value,
              }))}
              suffix={(row) => (totalPaid ? `${Math.round((row.value / totalPaid) * 100)}%` : '')}
              empty="No payments in this period yet."
            />
          </Panel>
        ) : (
          <div />
        )}
        <StaffSystemInsights snapshot={snapshot} />
        <StaffPlatformHealth snapshot={snapshot} />
      </div>

      {showMoney && showApps ? (
        <div className="mt-4">
          <Panel title="How candidates pay" note={totalPaid ? `${totalPaid.toLocaleString('en-GB')} payments` : undefined}>
            <BarList
              rows={analytics.paymentMethods.map((m) => ({
                label: m.label === 'NETBANKING' ? 'Net banking' : m.label === 'CARD' ? 'Card' : m.label,
                value: m.value,
              }))}
              suffix={(row) => (totalPaid ? `${Math.round((row.value / totalPaid) * 100)}%` : '')}
              empty="No payments in this period yet."
            />
          </Panel>
        </div>
      ) : null}
    </AdminShell>
  );
}
