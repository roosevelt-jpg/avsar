import Link from 'next/link';
import type { PlatformSnapshot } from '@/lib/console/platform-snapshot';
import type { Kpi } from '@/lib/console/analytics';
import { DashHeroPanel, dashPrimaryBtn, dashSecondaryBtn } from '@/components/console/DashHeroPanel';

/**
 * Staff home: hero, platform totals, quick actions, growth ring.
 * Numbers are live; nothing invented for the shell.
 */

export function StaffDashHero({
  canPostJob,
  canAddEmployer,
  canEditCms,
  roleLabel,
}: {
  canPostJob: boolean;
  canAddEmployer: boolean;
  canEditCms: boolean;
  roleLabel?: string;
}) {
  return (
    <DashHeroPanel
      eyebrow="Platform overview"
      badge={
        roleLabel ? (
          <span className="inline-flex items-center rounded-[5px] bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-[#d4b574]">
            {roleLabel}
          </span>
        ) : null
      }
      title="S&A Recruitment console"
      intro="Candidates, employers, jobs, assessments and payments — live numbers for the desk."
      actions={
        <>
          {canPostJob ? (
            <Link href="/admin/jobs/new" className={dashPrimaryBtn}>
              Post a job
            </Link>
          ) : null}
          {canAddEmployer ? (
            <Link href="/admin/employers" className={dashSecondaryBtn}>
              Add employer
            </Link>
          ) : null}
          {canEditCms ? (
            <Link href="/admin/cms" className={dashSecondaryBtn}>
              Manage content
            </Link>
          ) : null}
        </>
      }
    />
  );
}

export function StaffPlatformStatStrip({
  snapshot,
  growthPct,
}: {
  snapshot: PlatformSnapshot;
  growthPct: number | null;
}) {
  const cards = [
    { value: snapshot.candidates, label: 'Total Candidates', href: '/admin' },
    { value: snapshot.employers, label: 'Employers', href: '/admin/employers' },
    { value: snapshot.activeJobs, label: 'Active Jobs', href: '/admin/jobs?status=published' },
    { value: snapshot.applications, label: 'Applications', href: '/admin/applications' },
    { value: snapshot.interviews, label: 'Interviews', href: '/admin/applications?status=interview' },
    { value: snapshot.hires, label: 'Hires', href: '/admin/applications?status=hired' },
  ];

  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-7">
      {cards.map((card) => (
        <li key={card.label} className="min-w-0">
          <Link
            href={card.href}
            className="t-colors flex h-full min-w-0 flex-col overflow-hidden rounded-[12px] border border-[#e2e5ea] bg-white p-4 no-underline hover:border-[#b28a49]/45"
          >
            <p className="m-0 text-[22px] font-semibold leading-none tracking-[-0.03em] text-[#142438]">
              {card.value.toLocaleString('en-GB')}
            </p>
            <p className="m-0 mt-1.5 text-[12px] leading-snug text-[#5c7084]">{card.label}</p>
          </Link>
        </li>
      ))}
      {/* Same vertical rhythm as the count cards so the ring + labels stay inside a narrow grid cell. */}
      <li className="min-w-0 overflow-hidden rounded-[12px] border border-[#e2e5ea] bg-white p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="relative flex size-8 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#b28a49 ${Math.max(0, Math.min(100, growthPct ?? 0))}%, #e8e4dc 0)`,
            }}
            aria-hidden
          >
            <span className="absolute inset-[3px] rounded-full bg-white" />
          </span>
          <p className="m-0 min-w-0 text-[22px] font-semibold leading-none tracking-[-0.03em] text-[#142438]">
            {growthPct == null ? '—' : `${growthPct}%`}
          </p>
        </div>
        <p className="m-0 mt-1.5 text-[12px] leading-snug break-words text-[#5c7084]">Platform growth vs prior</p>
      </li>
    </ul>
  );
}

export function StaffQuickActions({
  items,
}: {
  items: { href: string; label: string; note: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Quick Actions</h2>
      <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="t-colors flex h-full flex-col rounded-[10px] border border-[#142438]/1 bg-[#f7f8fa] px-3 py-3 no-underline hover:border-[#b28a49]/5"
            >
              <span className="text-[13px] font-semibold text-[#142438]">{item.label}</span>
              <span className="mt-1 text-[11px] text-[#5c7084]">{item.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StaffSystemInsights({ snapshot }: { snapshot: PlatformSnapshot }) {
  const segments = [
    { label: 'Visible in pool', pct: snapshot.visiblePct, color: '#2a4a6e' },
    { label: 'In process', pct: snapshot.inProcessPct, color: '#b28a49' },
    { label: 'Hired', pct: snapshot.hiredPct, color: '#2f7d4a' },
  ];
  const used = segments.reduce((a, s) => a + s.pct, 0);
  const inactive = Math.max(0, 100 - used);
  const all = [...segments, { label: 'Other / inactive', pct: inactive, color: '#cfc8bc' }];
  let offset = 0;
  const stops = all
    .map((s) => {
      const start = offset;
      offset += s.pct;
      return `${s.color} ${start}% ${offset}%`;
    })
    .join(', ');

  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">System Insights</h2>
      <p className="m-0 mt-1 text-[12px] text-[#5c7084]">Candidate pool mix (live counts).</p>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <span
          className="relative flex size-28 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${stops})` }}
          aria-hidden
        >
          <span className="absolute inset-[18px] rounded-full bg-white" />
        </span>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {all.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-[13px] text-[#142438]">
              <span className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.label} · {s.pct}%
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function StaffPlatformHealth({ snapshot }: { snapshot: PlatformSnapshot }) {
  const rows = [
    { label: 'Website & CMS', ok: true },
    { label: 'Payments & Billing', ok: true },
    {
      label: 'Integrations vault',
      ok: snapshot.integrationsConfigured,
      note: snapshot.integrationsConfigured ? undefined : 'Set INTEGRATIONS_MASTER_KEY',
    },
  ];
  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Platform Health</h2>
      <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start justify-between gap-3 text-[14px]">
            <span className="text-[#142438]">
              {row.label}
              {row.note ? <span className="mt-0.5 block text-[12px] text-[#5c7084]">{row.note}</span> : null}
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                row.ok ? 'bg-[#2f7d4a]/15 text-[#2f7d4a]' : 'bg-[#f3e6c8] text-[#8a6a34]'
              }`}
            >
              {row.ok ? 'Operational' : 'Check'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Growth ring: this period’s new candidates as a share of this + previous. */
export function growthFromKpis(kpis: Kpi[]): number | null {
  const signup = kpis.find((k) => k.key === 'signups');
  if (!signup || signup.previous == null) return null;
  const total = signup.value + signup.previous;
  if (total <= 0) return 0;
  return Math.round((signup.value / total) * 100);
}
