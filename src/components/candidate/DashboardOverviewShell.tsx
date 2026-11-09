import Image from 'next/image';
import Link from 'next/link';
import type { CandidateApplication } from '@/lib/applications/data';
import { PIPELINE, STATUS_META, pipelineIndex, type ApplicationStatus } from '@/lib/applications/status';
import type { CandidateStatus } from '@/lib/candidate/status';
import type { Job } from '@/lib/jobs/types';
import { formatSalary } from '@/lib/jobs/types';
import type { Milestone } from '@/lib/relocation/milestones';
import { progress } from '@/lib/relocation/milestones';
import { localePath, type Locale } from '@/lib/i18n';

/**
 * Mockup-shaped overview widgets: hero, KPI strip, application progress,
 * next-steps checklist, relocation promo, recommended jobs, journey strip.
 * Numbers come only from live applications / jobs / status — no placeholders.
 */

export function applicationProgressPct(status: ApplicationStatus): number {
  if (STATUS_META[status].tone === 'stopped') return 0;
  const idx = pipelineIndex(status);
  if (idx < 0) return 8;
  return Math.round(((idx + 1) / PIPELINE.length) * 100);
}

export function profileCompletionPct(status: CandidateStatus, applicationCount: number): number {
  let score = 0;
  if (status.profileComplete) score += 25;
  if (status.cvUploaded || status.cvRewritten) score += 20;
  if (status.assessmentComplete) score += 25;
  else if (status.sectionsDone.length > 0) {
    score += Math.round((status.sectionsDone.length / status.sectionsTotal) * 20);
  }
  if (applicationCount > 0) score += 15;
  if (status.ownsSkills || status.reportReady) score += 15;
  return Math.min(100, score);
}

export function DashboardHero({
  locale,
  firstName,
  assessmentComplete,
  verified = false,
}: {
  locale: Locale;
  firstName: string;
  assessmentComplete: boolean;
  verified?: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-[18px] bg-[#142438] text-white">
      <Image
        src="/photos/brand/dash-office.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 900px"
        className="object-cover object-center opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#142438]/94 via-[#142438]/72 to-[#142438]/35" />
      <div className="relative z-[1] px-5 py-7 sm:px-8 sm:py-9 lg:max-w-[58%]">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <p className="m-0 text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--dash-gold,#b28a49)]">Your dashboard</p>
          <span
            className={`inline-flex items-center rounded-[6px] px-2.5 py-0.5 text-[11px] font-medium ${
              verified ? 'bg-[#b28a49]/25 text-[#b28a49]' : 'bg-white/15 text-white/80'
            }`}
          >
            {verified ? 'Verified candidate' : 'Candidate'}
          </span>
        </div>
        <h1
          className="display-serif m-0 text-[clamp(26px,3.4cqi,40px)] font-normal leading-[1.1] tracking-[-0.02em] text-white"
        >
          Welcome Back, {firstName}!
        </h1>
        <p className="m-0 mt-3 max-w-[48ch] text-[15px] leading-[1.6] text-white/85">
          Track your applications, discover new opportunities, and take the next step in your career in Portugal.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            href={localePath(locale, '/jobs')}
            className="inline-flex rounded-[8px] bg-[#b28a49] px-4 py-2.5 text-[14px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
          >
            Browse Jobs →
          </Link>
          <Link
            href={localePath(locale, '/assessment')}
            className="inline-flex rounded-[8px] border border-white/55 px-4 py-2.5 text-[14px] font-medium text-white no-underline hover:bg-white/10"
          >
            {assessmentComplete ? 'Retake a Skills Test' : 'Complete a Skills Test'}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function DashboardStatStrip({
  matchedJobs,
  inProgress,
  interviews,
  relocationOpen,
  profilePct,
}: {
  matchedJobs: number;
  inProgress: number;
  interviews: number;
  relocationOpen: number;
  profilePct: number;
}) {
  const cards = [
    { value: String(matchedJobs), label: 'Job Opportunities Matched for You', icon: 'briefcase' as const },
    { value: String(inProgress), label: 'Applications In Progress', icon: 'stack' as const },
    { value: String(interviews), label: 'Interview Scheduled', icon: 'shield' as const },
    { value: String(relocationOpen), label: 'Relocation Tasks In Progress', icon: 'plane' as const },
    { value: `${profilePct}%`, label: 'Profile Completion', icon: 'ring' as const, pct: profilePct },
  ];

  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-4 border-y border-[#e2e5ea] bg-transparent py-4 p-0 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <li key={card.label} className="flex min-w-0 items-start gap-3 overflow-hidden">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center text-[#b28a49]">
            {card.icon === 'ring' ? (
              <span
                className="relative flex size-7 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#b28a49 ${card.pct ?? 0}%, #e8e4dc 0)`,
                }}
                aria-hidden
              >
                <span className="absolute inset-[2.5px] rounded-full bg-[#f4f5f7]" />
              </span>
            ) : (
              <StatIcon name={card.icon} />
            )}
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[20px] font-semibold leading-none tracking-[-0.03em] text-[#142438]">{card.value}</p>
            <p className="m-0 mt-1.5 text-[12px] leading-snug break-words text-[#5c7084]">{card.label}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatIcon({ name }: { name: 'briefcase' | 'stack' | 'shield' | 'plane' }) {
  const c = 'size-[18px]';
  if (name === 'briefcase') {
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    );
  }
  if (name === 'stack') {
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M12 2l9 4.5-9 4.5-9-4.5L12 2zM3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'shield') {
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M2 16l9-3 11 3-9 5-11-5zM11 13V4l4 1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function ApplicationProgressPanel({
  locale,
  applications,
}: {
  locale: Locale;
  applications: CandidateApplication[];
}) {
  const rows = applications.slice(0, 3);
  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <div className="flex items-end justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Application Progress</h2>
        {applications.length > 0 ? (
          <Link
            href={localePath(locale, '/dashboard/applications')}
            className="text-[13px] font-medium text-[#b28a49] no-underline hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="m-0 mt-4 text-[14px] leading-[1.55] text-[#5c7084]">
          You have not applied yet.{' '}
          <Link href={localePath(locale, '/jobs')} className="text-[#142438] underline">
            See open jobs
          </Link>
          .
        </p>
      ) : (
        <ul className="m-0 mt-4 flex list-none flex-col gap-4 p-0">
          {rows.map((application) => {
            const pct = applicationProgressPct(application.status);
            const tone = STATUS_META[application.status].tone;
            const tagClass =
              tone === 'success'
                ? 'bg-[#b28a49]/18 text-[#8a6a34]'
                : tone === 'progress'
                  ? 'bg-[#f3e6c8] text-[#8a6a34]'
                  : tone === 'stopped'
                    ? 'bg-[#ececec] text-[#5c7084]'
                    : 'bg-[#dbe7f5] text-[#2a4a6e]';
            return (
              <li key={application.id} className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[14px] font-semibold text-[#142438]">{application.job.title}</p>
                    <p className="m-0 mt-0.5 truncate text-[12px] text-[#5c7084]">
                      {application.job.city}
                      {application.job.employerDisplay ? ` · ${application.job.employerDisplay}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${tagClass}`}>
                    {STATUS_META[application.status].label}
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#e8eaed]">
                  <div className="h-full rounded-full bg-[#b28a49]" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function NextStepsChecklist({
  locale,
  status,
  applicationCount,
  hasInterview,
}: {
  locale: Locale;
  status: CandidateStatus;
  applicationCount: number;
  hasInterview: boolean;
}) {
  const items = [
    {
      done: status.profileComplete,
      label: 'Complete your profile',
      href: localePath(locale, '/profile'),
    },
    {
      done: status.assessmentComplete,
      label: 'Take a skills assessment',
      href: localePath(locale, '/assessment'),
    },
    {
      done: status.cvUploaded || status.cvRewritten,
      label: 'Upload updated CV',
      href: localePath(locale, '/profile'),
    },
    {
      done: applicationCount > 0,
      label: 'Apply for recommended jobs',
      href: localePath(locale, '/jobs'),
    },
    {
      done: hasInterview,
      label: 'Prepare for interview',
      href: localePath(locale, '/dashboard/applications'),
    },
  ];

  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Your Next Steps</h2>
      <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 text-[14px] no-underline ${
                item.done ? 'text-[#5c7084] line-through' : 'text-[#142438] hover:text-[#b28a49]'
              }`}
            >
              <span
                aria-hidden
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  item.done
                    ? 'border-[#b28a49] bg-[#b28a49] text-[#142438]'
                    : 'border-[#cfc8bc] bg-white text-transparent'
                }`}
              >
                ✓
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RelocationPromoCard({ locale }: { locale: Locale }) {
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
          Get step-by-step guidance on work visas, travel and settling in Portugal.
        </p>
        <Link
          href={localePath(locale, '/dashboard/relocation')}
          className="mt-4 inline-flex w-fit rounded-[8px] bg-[#b28a49] px-3.5 py-2 text-[13px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
        >
          View Relocation Guide →
        </Link>
      </div>
    </section>
  );
}

export function RecommendedJobsPanel({ locale, jobs }: { locale: Locale; jobs: Job[] }) {
  if (jobs.length === 0) return null;
  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <div className="flex items-end justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">Recommended for You</h2>
        <Link href={localePath(locale, '/jobs')} className="text-[13px] font-medium text-[#b28a49] no-underline hover:underline">
          Browse all
        </Link>
      </div>
      <ul className="m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-3">
        {jobs.slice(0, 3).map((job) => {
          const salary = formatSalary(job);
          return (
            <li key={job.id}>
              <Link
                href={localePath(locale, `/jobs/${job.slug}`)}
                className="t-colors block rounded-[12px] border border-[#142438]/08 bg-[#f7f8fa] p-4 no-underline hover:border-[#b28a49]/50"
              >
                <p className="m-0 text-[14px] font-semibold text-[#142438]">{job.title}</p>
                <p className="m-0 mt-1 text-[12px] text-[#5c7084]">{job.city}</p>
                {salary ? <p className="m-0 mt-2 text-[13px] font-medium text-[#142438]">{salary}</p> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** High-level move stages derived from applications + milestones — not inventing a second plan. */
export function RelocationJourneyStrip({
  applications,
  milestones,
}: {
  applications: CandidateApplication[];
  milestones: Milestone[];
}) {
  const hasApplied = applications.length > 0;
  const hasOffer = applications.some((a) =>
    ['offer', 'hired', 'visa_processing', 'relocated'].includes(a.status),
  );
  const visaKeys = new Set(['contract_signed', 'documents_ready', 'visa_appointment', 'visa_issued']);
  const travelKeys = new Set(['flight_booked', 'arrived']);
  const settleKeys = new Set(['accommodation_checkin', 'first_day', 'nif', 'niss', 'bank_account', 'sns', 'aima_residence']);

  const stageState = (keys: Set<string>, fallbackDone: boolean, fallbackCurrent: boolean) => {
    const relevant = milestones.filter((m) => keys.has(m.key));
    if (relevant.length === 0) {
      if (fallbackDone) return 'done' as const;
      if (fallbackCurrent) return 'current' as const;
      return 'todo' as const;
    }
    if (relevant.every((m) => m.status === 'done' || m.status === 'skipped')) return 'done' as const;
    if (relevant.some((m) => m.status === 'in_progress' || m.status === 'blocked' || m.status === 'done')) {
      return 'current' as const;
    }
    return 'todo' as const;
  };

  const stages: { label: string; state: 'done' | 'current' | 'todo' }[] = [
    { label: 'Application', state: hasApplied ? 'done' : 'current' },
    {
      label: 'Job Offer',
      state: hasOffer ? 'done' : hasApplied ? 'current' : 'todo',
    },
    {
      label: 'Visa Process',
      state: stageState(visaKeys, applications.some((a) => a.status === 'relocated'), hasOffer),
    },
    {
      label: 'Travel',
      state: stageState(
        travelKeys,
        applications.some((a) => a.status === 'relocated'),
        false,
      ),
    },
    {
      label: 'Settling In',
      state: stageState(settleKeys, false, false),
    },
  ];

  /* Once a later stage is current/done, earlier todos promote so the strip never looks stuck. */
  let sawOpen = false;
  const normalised = stages.map((stage) => {
    if (stage.state === 'todo' && !sawOpen) {
      sawOpen = true;
      return { ...stage, state: 'current' as const };
    }
    if (stage.state !== 'done') sawOpen = true;
    return stage;
  });

  const milProgress = milestones.length ? progress(milestones) : null;

  return (
    <section className="rounded-[14px] border border-[#142438]/08 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(20,36,56,0.35)]">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#142438]">My Relocation Journey</h2>
        {milProgress ? (
          <p className="m-0 text-[12px] text-[#5c7084]">
            {milProgress.done} of {milProgress.total} plan steps done
          </p>
        ) : null}
      </div>
      <ol className="m-0 mt-5 flex list-none flex-wrap items-start gap-y-4 p-0">
        {normalised.map((stage, index) => {
          const last = index === normalised.length - 1;
          const colour =
            stage.state === 'done' ? '#2f7d4a' : stage.state === 'current' ? '#b28a49' : '#cfc8bc';
          return (
            <li key={stage.label} className="flex min-w-[110px] flex-1 items-start">
              <div className="flex w-full flex-col items-center text-center">
                <span
                  className="flex size-8 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                  style={{ background: colour }}
                  aria-current={stage.state === 'current' ? 'step' : undefined}
                >
                  {stage.state === 'done' ? '✓' : index + 1}
                </span>
                <p className="m-0 mt-2 text-[12px] font-medium text-[#142438]">{stage.label}</p>
                {!last ? (
                  <span className="sr-only">
                    {stage.state === 'done' ? 'Completed' : stage.state === 'current' ? 'Current' : 'Upcoming'}
                  </span>
                ) : null}
              </div>
              {!last ? (
                <span
                  aria-hidden
                  className="mt-4 h-0.5 flex-1 self-start"
                  style={{
                    background: normalised[index + 1]?.state === 'todo' && stage.state !== 'done' ? '#e8e4dc' : colour,
                  }}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
