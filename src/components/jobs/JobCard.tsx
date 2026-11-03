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
          {salary && <span className="chip-gradient rounded-full px-3 py-1 text-[13px] font-semibold">{salary}</span>}
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

function JobListCard({
  job,
  locale,
  priority,
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
  const image = jobImage(job);
  const href = localePath(locale, `/jobs/${job.slug}`);
  const verified = board ? siteText(locale, board.verifiedBadge) : siteText(locale, 'Verified');
  const viewDetails = board ? siteText(locale, board.viewDetails) : siteText(locale, 'View details');
  const applyNow = board ? siteText(locale, board.applyNow) : siteText(locale, 'Apply now');
  const category = job.area ? siteText(locale, areaLabel(job.area)) : '';

  return (
    <article className="group relative grid grid-cols-1 overflow-hidden rounded-[16px] border border-line bg-white shadow-[0_10px_28px_-22px_rgba(10,8,143,0.35)] sm:grid-cols-[140px_minmax(0,1fr)] lg:grid-cols-[148px_minmax(0,1fr)_auto]">
      <div className="relative aspect-[4/3] bg-[#f3f4f8] sm:aspect-auto sm:min-h-[148px]">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 148px"
            unoptimized={!image.startsWith('/')}
            priority={priority}
            className="object-cover"
          />
        ) : (
          <div className="placeholder-stripes size-full" />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold-soft)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#0a088f]">
            <span aria-hidden className="text-[var(--color-gold)]">
              ✓
            </span>
            {verified}
          </span>
          {job.featured ? (
            <span className="rounded-full bg-[#0a088f] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
              {siteText(locale, 'Featured')}
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="m-0 text-[clamp(18px,2cqi,22px)] font-semibold leading-[1.25] tracking-[-0.02em] text-[#0a088f]">
            <Link href={href} className="text-inherit no-underline hover:underline">
              {job.title}
            </Link>
          </h3>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[13px] text-ink-2">
            <li>{jobLocation(job)}</li>
            {category ? <li>{category}</li> : null}
            <li>{siteText(locale, EMPLOYMENT_LABELS[job.employmentType])}</li>
          </ul>
        </div>

        {job.summary ? <p className="m-0 line-clamp-2 text-[14px] leading-[1.5] text-muted">{job.summary}</p> : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {saved !== undefined ? <SaveJobButton jobId={job.id} initialSaved={saved} /> : null}
          <Link
            href={href}
            className="t-colors inline-flex items-center rounded-full border border-line-strong bg-white px-4 py-2 text-[13px] font-semibold text-[#0a088f] no-underline hover:border-[#0a088f]"
          >
            {viewDetails}
          </Link>
          <Link href={href} className="btn-gradient t-colors inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold no-underline">
            {applyNow}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {salary ? (
        <div className="flex items-start justify-end border-t border-line bg-[var(--color-gold-soft)] px-4 py-4 sm:border-t-0 lg:border-s lg:px-5">
          <p className="m-0 max-w-[12ch] text-end text-[15px] font-semibold leading-[1.35] text-[#0a088f]">{salary}</p>
        </div>
      ) : null}
    </article>
  );
}
