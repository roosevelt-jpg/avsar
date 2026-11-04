import Image from 'next/image';
import Link from 'next/link';
import type { PlatformSnapshot } from '@/lib/console/platform-snapshot';
import type { Kpi } from '@/lib/console/analytics';

/**
 * Mockup-shaped blocks for the staff home: hero, platform totals, quick
 * actions, growth ring. Numbers are live; nothing invented for the shell.
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
    <section className="relative overflow-hidden rounded-[18px] bg-[#142438] text-white">
      <Image
        src="/photos/brand/footer-lisbon.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 1280px) 100vw, 1200px"
        className="object-cover"
      />
      <div className="hero-copy-legible relative z-[1] px-5 py-7 sm:px-8 sm:py-9 lg:max-w-[70%]">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="m-0 text-[12px] font-medium uppercase tracking-[0.14em] text-[#e8c56a]">Platform Overview</p>
          {roleLabel ? (
            <span className="inline-flex items-center rounded-full bg-[#b28a49]/25 px-2.5 py-0.5 text-[11px] font-medium text-[#e8c56a]">
              {roleLabel}
            </span>
          ) : null}
        </div>
        <h1
          className="m-0 mt-2 text-[clamp(26px,3.4cqi,40px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          S&amp;A Recruitment Admin
        </h1>
        <p className="m-0 mt-3 max-w-[54ch] text-[15px] leading-[1.6] text-white/85">
          Manage recruitment, candidates, employers, jobs, assessments, payments, and the entire platform.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {canPostJob ? (
            <Link
              href="/admin/jobs/new"
              className="inline-flex rounded-[8px] bg-[#b28a49] px-4 py-2.5 text-[14px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
            >
              + Post a Job
            </Link>
          ) : null}
          {canAddEmployer ? (
            <Link
              href="/admin/employers"
              className="inline-flex rounded-[8px] border border-white/55 px-4 py-2.5 text-[14px] font-medium text-white no-underline hover:bg-white/10"
            >
              Add Employer
            </Link>
          ) : null}
          {canEditCms ? (
            <Link
              href="/admin/cms"
              className="inline-flex rounded-[8px] border border-white/55 px-4 py-2.5 text-[14px] font-medium text-white no-underline hover:bg-white/10"
            >
              Manage Content
            </Link>
          ) : null}
        </div>
      </div>
    </section>
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
        <li key={card.label}>
          <Link
            href={card.href}
            className="t-colors flex h-full flex-col rounded-[14px] border border-[#142438]/08 bg-white p-4 no-underline shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)] hover:border-[#b28a49]/45"
          >
            <p className="m-0 text-[22px] font-semibold leading-none tracking-[-0.03em] text-[#142438]">
              {card.value.toLocaleString('en-GB')}
            </p>
            <p className="m-0 mt-1.5 text-[12px] leading-snug text-[#5c7084]">{card.label}</p>
          </Link>
        </li>
      ))}
      <li className="flex items-center gap-3 rounded-[14px] border border-[#142438]/08 bg-white p-4 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
        <span
          className="relative flex size-12 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#b28a49 ${Math.max(0, Math.min(100, growthPct ?? 0))}%, #e8e4dc 0)`,
          }}
          aria-hidden
        >
          <span className="absolute inset-[3px] rounded-full bg-white" />
          <span className="relative text-[11px] font-semibold text-[#142438]">
            {growthPct == null ? '—' : `${growthPct}%`}
          </span>
        </span>
        <div className="min-w-0">
          <p className="m-0 text-[13px] font-semibold text-[#142438]">Platform Growth</p>
          <p className="m-0 mt-0.5 text-[11px] text-[#5c7084]">New candidates vs prior period</p>
        </div>
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
              className="t-colors flex h-full flex-col rounded-[10px] border border-[#142438]/1 bg-[#faf8f4] px-3 py-3 no-underline hover:border-[#b28a49]/5"
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
