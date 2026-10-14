import Image from 'next/image';
import Link from 'next/link';
import { formatSalary, HOUSING_LABELS, jobLocation, type Job } from '@/lib/jobs/types';
import { positionImage } from '@/lib/data/position-images';
import { positionBySlug, type PositionSlug } from '@/lib/data/positions';
import type { Locale } from '@/lib/i18n';

/** The image a job shows: its own, else its position's photograph, else none. */
export function jobImage(job: Pick<Job, 'heroImageUrl' | 'positionSlug'>): string | null {
  if (job.heroImageUrl) return job.heroImageUrl;
  if (job.positionSlug && positionBySlug(job.positionSlug)) return positionImage(job.positionSlug as PositionSlug, 840);
  return null;
}

export function JobCard({ job, locale, priority = false }: { job: Job; locale: Locale; priority?: boolean }) {
  const salary = formatSalary(job);
  const image = jobImage(job);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[22px] border border-line bg-surface transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_18px_40px_-24px_rgba(27,26,23,0.35)]">
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
            <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-white">Featured</span>
          )}
          {job.visaSponsored && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink backdrop-blur">
              Visa support
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="m-0 font-mono text-[12px] text-muted">{jobLocation(job)}</p>
        <h3 className="m-0 mt-1.5 text-[19px] font-semibold leading-[1.25] tracking-[-0.015em]">
          <Link href={`/${locale}/jobs/${job.slug}`} className="text-ink no-underline after:absolute after:inset-0 after:content-['']">
            {job.title}
          </Link>
        </h3>
        {job.employerDisplay ? <p className="m-0 mt-1 text-[14px] text-ink-2">{job.employerDisplay}</p> : null}
        <p className="m-0 mt-3 line-clamp-2 text-[14px] leading-[1.55] text-muted">{job.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {salary && <span className="rounded-full bg-ink px-3 py-1 text-[13px] font-medium text-paper">{salary}</span>}
          <span className="rounded-full border border-line px-3 py-1 text-[13px] text-ink-2">{HOUSING_LABELS[job.housing]}</span>
          {job.openings > 1 && <span className="rounded-full border border-line px-3 py-1 text-[13px] text-ink-2">{job.openings} openings</span>}
        </div>
      </div>
    </article>
  );
}
