import Image from 'next/image';
import Link from 'next/link';
import type { EmployerApplicant, VacancyRequest } from '@/lib/employer/portal';
import { REQUEST_STATUS_LABELS } from '@/lib/employer/portal';
import { STATUS_META } from '@/lib/applications/status';
import { interviewTimes } from '@/lib/interviews/time';

/**
 * Mockup-shaped employer home widgets. Counts come only from vacancies and
 * shortlisted-or-later applicants employers are allowed to see — never invented
 * funnel totals from pre-screen stages.
 */

export type EmployerDashStats = {
  activeJobs: number;
  applicants: number;
  shortlisted: number;
  interviews: number;
  hires: number;
  hiringPct: number;
};

export function buildEmployerDashStats(
  vacancies: VacancyRequest[],
  applicants: EmployerApplicant[],
): EmployerDashStats {
  const activeJobs = vacancies.filter((v) => v.status === 'published').length;
  const shortlisted = applicants.filter((a) => a.status === 'shortlisted').length;
  const interviews = applicants.filter((a) => a.status === 'interview' || a.nextInterviewAt).length;
  const hires = applicants.filter((a) => ['hired', 'visa_processing', 'relocated'].includes(a.status)).length;
  const openings = vacancies
    .filter((v) => v.status === 'published' || v.status === 'draft')
    .reduce((sum, v) => sum + Math.max(1, v.openings), 0);
  const hiringPct = openings > 0 ? Math.min(100, Math.round((hires / openings) * 100)) : hires > 0 ? 100 : 0;
  return {
    activeJobs,
    applicants: applicants.length,
    shortlisted,
    interviews,
    hires,
    hiringPct,
  };
}

export function EmployerDashHero({
  companyName,
  verified = false,
}: {
  companyName: string;
  verified?: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-[18px] bg-[#142438] text-white">
      <Image
        src="/photos/brand/footer-lisbon.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 1000px"
        className="object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#142438]/95 via-[#142438]/75 to-[#142438]/35" />
      <div className="relative z-[1] px-5 py-7 sm:px-8 sm:py-9 lg:max-w-[62%]">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <p className="m-0 text-[12px] font-medium uppercase tracking-[0.14em] text-[#e8c56a]">Employer portal</p>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              verified ? 'bg-[#2f7d4a]/25 text-[#7dcea0]' : 'bg-[#b28a49]/25 text-[#e8c56a]'
            }`}
          >
            {verified ? 'Verified Employer' : 'Employer'}
          </span>
        </div>
        <h1
          className="m-0 text-[clamp(26px,3.4cqi,40px)] font-semibold leading-[1.1] tracking-[-0.02em] text-[#e8c56a]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Welcome Back, {companyName}!
        </h1>
        <p className="m-0 mt-3 max-w-[52ch] text-[15px] leading-[1.6] text-white/85">
          Manage your job postings, review candidates, and hire top talent for your team in Portugal.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            href="/admin/vacancies#request"
            className="inline-flex rounded-[8px] bg-[#b28a49] px-4 py-2.5 text-[14px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
          >
            Post a New Job →
          </Link>
          <Link
            href="#talent-search"
            className="inline-flex rounded-[8px] border border-white/55 px-4 py-2.5 text-[14px] font-medium text-white no-underline hover:bg-white/10"
          >
            Browse Candidates
          </Link>
        </div>
      </div>
    </section>
  );
}

export function EmployerStatStrip({ stats }: { stats: EmployerDashStats }) {
  const cards = [
    { value: String(stats.activeJobs), label: 'Active Job Postings', icon: 'briefcase' as const },
    { value: String(stats.applicants), label: 'Candidates Shared With You', icon: 'group' as const },
    { value: String(stats.shortlisted), label: 'Shortlisted Candidates', icon: 'star' as const },
    { value: String(stats.interviews), label: 'Interviews Scheduled', icon: 'cal' as const },
    { value: String(stats.hires), label: 'Hires Made', icon: 'hire' as const },
    { value: `${stats.hiringPct}%`, label: 'Hiring Progress', icon: 'ring' as const, pct: stats.hiringPct },
  ];

  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <li
          key={card.label}
          className="flex min-w-0 items-start gap-3 overflow-hidden rounded-[14px] border border-[#142438]/08 bg-white p-4 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#142438]/06 text-[#b28a49]">
            {card.icon === 'ring' ? (
              <span
                className="relative flex size-8 items-center justify-center rounded-full"
                style={{ background: `conic-gradient(#b28a49 ${card.pct ?? 0}%, #e8e4dc 0)` }}
                aria-hidden
              >
                <span className="absolute inset-[3px] rounded-full bg-white" />
              </span>
            ) : (
              <StatIcon name={card.icon} />
            )}
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[22px] font-semibold leading-none tracking-[-0.03em] text-[#142438]">{card.value}</p>
            <p className="m-0 mt-1.5 text-[12px] leading-snug break-words text-[#5c7084]">{card.label}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatIcon({ name }: { name: 'briefcase' | 'group' | 'star' | 'cal' | 'hire' }) {
  const c = 'size-[18px]';
  if (name === 'briefcase') {
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    );
  }
  if (name === 'group') {
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 20c.9-3.2 3.4-5 7-5s6.1 1.8 7 5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'star') {
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18l.9-5.4L4.2 8.7l5.4-.8L12 3z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'cal') {
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M7 11l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" strokeLinecap="round" />
    </svg>
  );
}

export function RecentApplicationsPanel({ applicants }: { applicants: EmployerApplicant[] }) {
  const rows = [...applicants]
    .sort((a, b) => b.statusChangedAt.localeCompare(a.statusChangedAt))
    .slice(0, 3);

  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <div className="flex items-end justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Recent Applications</h2>
        <Link href="/admin/applicants" className="text-[13px] font-medium text-[#b28a49] no-underline hover:underline">
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="m-0 mt-4 text-[14px] leading-[1.55] text-[#5c7084]">
          Nobody shortlisted for your vacancies yet. When a recruiter puts a candidate forward, they appear here.
        </p>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
          {rows.map((row) => {
            const tone = STATUS_META[row.status].tone;
            const tag =
              tone === 'success'
                ? 'bg-[#2f7d4a]/15 text-[#2f7d4a]'
                : tone === 'progress'
                  ? 'bg-[#f3e6c8] text-[#8a6a34]'
                  : 'bg-[#dbe7f5] text-[#2a4a6e]';
            const when = new Date(row.statusChangedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
            });
            return (
              <li key={row.applicationId} className="flex items-start justify-between gap-3 border-b border-[#142438]/06 pb-3 last:border-0 last:pb-0">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#142438]/08 text-[12px] font-semibold text-[#142438]"
                  >
                    {row.candidateName
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? '')
                      .join('')}
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[14px] font-semibold text-[#142438]">{row.candidateName}</p>
                    <p className="m-0 mt-0.5 truncate text-[12px] text-[#5c7084]">
                      {row.jobTitle} · {row.jobCity}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-end">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${tag}`}>
                    {STATUS_META[row.status].label}
                  </span>
                  <p className="m-0 mt-1 text-[11px] text-[#5c7084]">{when}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function HiringFunnelPanel({ applicants }: { applicants: EmployerApplicant[] }) {
  const stages = [
    { label: 'Shared with you', count: applicants.length },
    { label: 'Shortlisted', count: applicants.filter((a) => ['shortlisted', 'interview', 'offer', 'hired', 'visa_processing', 'relocated'].includes(a.status)).length },
    { label: 'Interview', count: applicants.filter((a) => ['interview', 'offer', 'hired', 'visa_processing', 'relocated'].includes(a.status)).length },
    { label: 'Offer', count: applicants.filter((a) => ['offer', 'hired', 'visa_processing', 'relocated'].includes(a.status)).length },
    { label: 'Hired', count: applicants.filter((a) => ['hired', 'visa_processing', 'relocated'].includes(a.status)).length },
  ];
  const max = Math.max(1, ...stages.map((s) => s.count));

  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Hiring Funnel</h2>
      <p className="m-0 mt-1 text-[12px] text-[#5c7084]">From candidates our team has put forward for your roles.</p>
      <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
        {stages.map((stage) => (
          <li key={stage.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
              <span className="text-[#142438]">{stage.label}</span>
              <span className="font-semibold text-[#142438]">{stage.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#ece8e0]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#b28a49] to-[#c9a35f]"
                style={{ width: `${Math.round((stage.count / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EmployerRelocationPromo() {
  return (
    <section className="relative overflow-hidden rounded-[14px] bg-[#142438] text-white shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <Image
        src="/photos/selected/visa.jpg"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 320px"
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-[#142438]/55" />
      <div className="relative z-[1] flex h-full min-h-[220px] flex-col justify-end p-5">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em]">Visa &amp; Relocation Support</h2>
        <p className="m-0 mt-2 text-[13px] leading-[1.55] text-white/85">
          We handle work visa guidance, documentation and relocation for your hired candidates.
        </p>
        <Link
          href="/admin/bench"
          className="mt-4 inline-flex w-fit rounded-[8px] bg-[#b28a49] px-3.5 py-2 text-[13px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
        >
          Request Support →
        </Link>
      </div>
    </section>
  );
}

export function ActiveJobsPanel({
  vacancies,
  applicants,
}: {
  vacancies: VacancyRequest[];
  applicants: EmployerApplicant[];
}) {
  const byTitle = new Map<string, number>();
  for (const a of applicants) {
    byTitle.set(a.jobTitle, (byTitle.get(a.jobTitle) ?? 0) + 1);
  }
  const rows = vacancies.filter((v) => v.status === 'published' || v.status === 'draft').slice(0, 3);

  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <div className="flex items-end justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Active Job Postings</h2>
        <Link href="/admin/vacancies" className="text-[13px] font-medium text-[#b28a49] no-underline hover:underline">
          Manage
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="m-0 mt-4 text-[14px] leading-[1.55] text-[#5c7084]">
          No vacancies yet.{' '}
          <Link href="/admin/vacancies#request" className="text-[#142438] underline">
            Request a role
          </Link>
          .
        </p>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
          {rows.map((job) => (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#142438]/06 pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="m-0 truncate text-[14px] font-semibold text-[#142438]">{job.title}</p>
                <p className="m-0 mt-0.5 text-[12px] text-[#5c7084]">
                  {job.city} · {byTitle.get(job.title) ?? 0} shared applicants
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  job.status === 'published' ? 'bg-[#2f7d4a]/15 text-[#2f7d4a]' : 'bg-[#f3e6c8] text-[#8a6a34]'
                }`}
              >
                {job.status === 'published' ? 'Active' : REQUEST_STATUS_LABELS[job.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function UpcomingInterviewsPanel({ applicants }: { applicants: EmployerApplicant[] }) {
  const rows = applicants
    .filter((a) => a.nextInterviewAt)
    .sort((a, b) => (a.nextInterviewAt ?? '').localeCompare(b.nextInterviewAt ?? ''))
    .slice(0, 4);

  return (
    <section
      id="interviews"
      className="scroll-mt-24 rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]"
    >
      <div className="flex items-end justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Upcoming Interviews</h2>
        <Link href="/admin/applicants#interviews" className="text-[13px] font-medium text-[#b28a49] no-underline hover:underline">
          All applicants
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="m-0 mt-4 text-[14px] leading-[1.55] text-[#5c7084]">
          No interviews booked yet. Your recruiter sets times once you ask to meet a shortlisted candidate.
        </p>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
          {rows.map((row) => {
            const when = interviewTimes(row.nextInterviewAt!);
            const d = new Date(row.nextInterviewAt!);
            const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Europe/Lisbon' });
            return (
              <li key={row.applicationId} className="flex items-center gap-3 border-b border-[#142438]/06 pb-3 last:border-0 last:pb-0">
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-[10px] bg-[#142438] text-center text-white">
                  <span className="text-[10px] uppercase tracking-wide text-white/70">{day.split(' ')[1]}</span>
                  <span className="text-[16px] font-semibold leading-none">{day.split(' ')[0]}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[14px] font-semibold text-[#142438]">{row.candidateName}</p>
                  <p className="m-0 mt-0.5 truncate text-[12px] text-[#5c7084]">
                    {row.jobTitle} · {when.lisbon}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

