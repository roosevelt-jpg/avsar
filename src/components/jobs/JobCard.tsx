import Image from 'next/image';
import Link from 'next/link';
import { formatSalary, HOUSING_LABELS, jobLocation, EMPLOYMENT_LABELS, type Job } from '@/lib/jobs/types';
import { positionImage } from '@/lib/data/position-images';
import { areaLabel, positionBySlug, type PositionSlug } from '@/lib/data/positions';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';
import type { JobsBoardSettings } from '@/lib/cms/settings';
import { SaveJobButton } from './SaveJobButton';

/** The image a job shows: its own, else its position's photograph, else none. */
export function jobImage(job: Pick<Job, 'heroImageUrl' | 'positionSlug'>): string | null {
  if (job.heroImageUrl) return job.heroImageUrl;
  if (job.positionSlug && positionBySlug(job.positionSlug)) return positionImage(job.positionSlug as PositionSlug, 840);
  return null;
}

type Props = {
  job: Job;
  locale: Locale;
  priority?: boolean;
  saved?: boolean;
  /** Horizontal board card matching the mockup. Grid is the older tile. */
  variant?: 'grid' | 'list';
  board?: JobsBoardSettings;
};

/** `saved` is undefined for visitors who cannot save (anonymous, staff), which hides the heart. */
export function JobCard({ job, locale, priority = false, saved, variant = 'grid', board }: Props) {
  if (variant === 'list') return <JobListCard job={job} locale={locale} priority={priority} saved={saved} board={board} />;
  return <JobGridCard job={job} locale={locale} priority={priority} saved={saved} />;
}

function JobGridCard({ job, locale, priority, saved }: Omit<Props, 'variant' | 'board'>) {
  const salary = formatSalary(job);
  const image = jobImage(job);
  return (
    <article className="blue-card group relative flex flex-col overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden bg-canvas">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={!image.startsWith('/')}
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="placeholder-stripes size-full" />
        )}
        <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
          {job.featured && (
            <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-white">
              {siteText(locale, 'Featured')}
            </span>
          )}
          {job.visaSponsored && (
            <span className="rounded-full bg-surface/90 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink backdrop-blur">
              {siteText(locale, 'Visa support')}
            </span>
          )}
        </div>
        {saved !== undefined && <SaveJobButton jobId={job.id} initialSaved={saved} className="absolute end-3 bottom-3" />}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="m-0 font-mono text-[12px] text-muted">{jobLocation(job)}</p>
        <h3 className="m-0 mt-1.5 text-[19px] font-semibold leading-[1.25] tracking-[-0.015em]">
          <Link href={localePath(locale, `/jobs/${job.slug}`)} className="text-ink no-underline after:absolute after:inset-0 after:content-['']">
            {job.title}
          </Link>
        </h3>
        {job.employerDisplay ? <p className="m-0 mt-1 text-[14px] text-ink-2">{job.employerDisplay}</p> : null}
        <p className="m-0 mt-3 line-clamp-2 text-[14px] leading-[1.55] text-muted">{job.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {salary && (
            <span className="rounded-[8px] bg-[#eef0f3] px-3 py-1 text-[13px] font-semibold text-[#142438]">{salary}</span>
          )}
          <span className="rounded-full border border-line px-3 py-1 text-[13px] text-ink-2">{siteText(locale, HOUSING_LABELS[job.housing])}</span>
          {job.openings > 1 && (
            <span className="rounded-full border border-line px-3 py-1 text-[13px] text-ink-2">
              {job.openings} {siteText(locale, 'openings')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function experienceLabel(years: number, locale: Locale): string {
  if (years <= 0) return siteText(locale, 'Entry level');
  if (years === 1) return siteText(locale, '1+ year');
  return `${years}+ ${siteText(locale, 'years')}`;
}

function postedLabel(publishedAt: string | null, locale: Locale): string | null {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * DSS-style board row: title first, meta chips, type/category/contract line,
 * salary bar and actions. No photo tile — the listing stays dense and scannable.
 */
function JobListCard({
  job,
  locale,
  saved,
  board,
}: {
  job: Job;
  locale: Locale;
  priority?: boolean;
  saved?: boolean;
  board?: JobsBoardSettings;
}) {
  const salary = formatSalary(job);
  const href = localePath(locale, `/jobs/${job.slug}`);
  const viewDetails = board ? siteText(locale, board.viewDetails) : siteText(locale, 'View details');
  const applyNow = board ? siteText(locale, board.applyNow) : siteText(locale, 'Apply now');
  const category = job.area ? siteText(locale, areaLabel(job.area)) : '';
  const posted = postedLabel(job.publishedAt, locale);
  const contract =
    job.contractMonths != null && job.contractMonths > 0
      ? `${job.contractMonths} ${siteText(locale, job.contractMonths === 1 ? 'month' : 'months')}`
      : siteText(locale, EMPLOYMENT_LABELS[job.employmentType]);

  const facts = [
    { label: siteText(locale, 'Type'), value: siteText(locale, EMPLOYMENT_LABELS[job.employmentType]) },
    category ? { label: siteText(locale, 'Category'), value: category } : null,
    { label: siteText(locale, 'Contract'), value: contract },
    { label: siteText(locale, 'Vacancy'), value: String(job.openings) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="relative overflow-hidden rounded-[12px] border border-[#e2e5ea] bg-white shadow-[0_8px_24px_-20px_rgba(20,36,56,0.45)]">
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {job.featured ? (
                <span className="rounded-[6px] bg-[#142438] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                  {siteText(locale, 'Featured')}
                </span>
              ) : null}
              {job.visaSponsored ? (
                <span className="rounded-[6px] bg-[color-mix(in_srgb,var(--color-gold)_22%,white)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#142438]">
                  {siteText(locale, 'Visa support')}
                </span>
              ) : null}
            </div>
            <h3 className="m-0 text-[clamp(20px,2.4cqi,26px)] font-semibold leading-[1.2] tracking-[-0.02em] text-[#142438]">
              <Link href={href} className="text-inherit no-underline hover:text-[#b28a49]">
                {job.title}
              </Link>
            </h3>
            <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[13px] text-ink-2">
              <li className="inline-flex items-center gap-1.5">
                <MetaIcon kind="experience" />
                {experienceLabel(job.minExperienceYears, locale)}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <MetaIcon kind="location" />
                {jobLocation(job)}
              </li>
              {posted ? (
                <li className="inline-flex items-center gap-1.5">
                  <MetaIcon kind="date" />
                  {posted}
                </li>
              ) : null}
            </ul>
          </div>
          {saved !== undefined ? <SaveJobButton jobId={job.id} initialSaved={saved} /> : null}
        </div>

        <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-[1.5] text-ink-2">
          {facts.map((fact, index) => (
            <span key={fact.label} className="inline-flex items-center gap-3">
              {index > 0 ? <span className="text-[#d5d9e0]" aria-hidden>|</span> : null}
              <span>
                <span className="font-medium text-[#142438]">{fact.label}:</span> {fact.value}
              </span>
            </span>
          ))}
        </p>

        {job.summary ? <p className="m-0 line-clamp-2 text-[14px] leading-[1.5] text-ink-2">{job.summary}</p> : null}

        <div className="mt-1 flex flex-col gap-3 border-t border-[#eef0f3] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-[14px] font-semibold text-[#142438]">
            {salary ? (
              <>
                <span className="font-medium text-ink-2">{siteText(locale, 'Basic salary')}:</span> {salary}
              </>
            ) : (
              siteText(locale, 'Salary on request')
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={href}
              className="t-colors inline-flex items-center rounded-[8px] bg-[#b28a49] px-4 py-2.5 text-[13px] font-semibold text-[#142438] no-underline hover:bg-[#c49a58]"
            >
              {viewDetails}
            </Link>
            <Link
              href={href}
              className="t-colors inline-flex items-center gap-1.5 rounded-[8px] border border-[#142438]/25 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#142438] no-underline hover:border-[#142438]"
            >
              {applyNow}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function MetaIcon({ kind }: { kind: 'experience' | 'location' | 'date' }) {
  const className = 'size-3.5 shrink-0 text-[#b28a49]';
  if (kind === 'location') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path d="M12 21s-6-6-6-11a6 6 0 0112 0c0 5-6 11-6 11z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    );
  }
  if (kind === 'date') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinecap="round" />
    </svg>
  );
}
