'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatSalary, HOUSING_LABELS, jobListingCode, jobLocation, EMPLOYMENT_LABELS, type Job } from '@/lib/jobs/types';
import { areaLabel } from '@/lib/data/positions';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';
import type { JobsBoardSettings } from '@/lib/cms/settings';
import { SaveJobButton } from './SaveJobButton';

type Props = {
  job: Job;
  locale: Locale;
  saved?: boolean;
  board?: JobsBoardSettings;
};

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
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function shareTargets(url: string, title: string) {
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  return [
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      className: 'bg-[#1877f2] text-white',
      icon: (
        <path d="M14 8h2.5V4.5H14A3.5 3.5 0 0010.5 8v2.5H8V14h2.5v6H14v-6h2.5l.5-3.5h-3V8z" fill="currentColor" stroke="none" />
      ),
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      className: 'bg-[#0a66c2] text-white',
      icon: (
        <>
          <rect x="4" y="4" width="16" height="16" rx="2.5" fill="currentColor" stroke="none" />
          <path d="M8 10.5V16 M8 7.6v.1 M11.5 16v-5.5 M11.5 13c0-1.5 1-2.5 2.3-2.5S16 11.3 16 13v3" stroke="#0a66c2" strokeWidth="1.6" />
        </>
      ),
    },
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${text}%20${encoded}`,
      className: 'bg-[#25d366] text-white',
      icon: (
        <path
          d="M12 4.5a7.5 7.5 0 00-6.5 11.2L4.5 19.5l3.9-1A7.5 7.5 0 1012 4.5zm0 1.4a6.1 6.1 0 11-5.1 2.8l.3.5-1.7 2.3 2.5-.7.5.3A6.1 6.1 0 0112 5.9z"
          fill="currentColor"
          stroke="none"
        />
      ),
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`,
      className: 'bg-[#111111] text-white',
      icon: <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    },
  ] as const;
}

/**
 * DSS-parity jobs board card: title, meta (experience, place, date, code),
 * type/category/contract/vacancy, salary, More Info, in-card expand, share and copy.
 */
export function JobListCard({ job, locale, saved, board }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const salary = formatSalary(job);
  const href = localePath(locale, `/jobs/${job.slug}`);
  const moreInfo = board ? siteText(locale, board.viewDetails || 'More Info') : siteText(locale, 'More Info');
  const applyNow = board ? siteText(locale, board.applyNow) : siteText(locale, 'Apply now');
  const category = job.area ? siteText(locale, areaLabel(job.area)) : '';
  const posted = postedLabel(job.publishedAt, locale);
  const contract =
    job.contractMonths != null && job.contractMonths > 0
      ? `${job.contractMonths} ${siteText(locale, job.contractMonths === 1 ? 'month' : 'months')}`
      : siteText(locale, EMPLOYMENT_LABELS[job.employmentType]);

  const facts = [
    { label: siteText(locale, 'Type'), value: siteText(locale, EMPLOYMENT_LABELS[job.employmentType]) },
    category ? { label: siteText(locale, 'Industry'), value: category } : null,
    { label: siteText(locale, 'Contract'), value: contract },
    { label: siteText(locale, 'Vacancy'), value: String(job.openings) },
  ].filter(Boolean) as { label: string; value: string }[];

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return href;
    return new URL(href, window.location.origin).toString();
  }, [href]);

  const shares = shareTargets(shareUrl, job.title);

  async function copyLink() {
    try {
      const url = typeof window === 'undefined' ? href : new URL(href, window.location.origin).toString();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="relative overflow-hidden rounded-[12px] border border-[#e2e5ea] bg-white shadow-[0_8px_24px_-20px_rgba(20,36,56,0.45)]">
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
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
              <li className="inline-flex items-center gap-1.5">
                <MetaIcon kind="code" />
                <span>
                  {siteText(locale, 'Code')}: {jobListingCode(job)}
                </span>
              </li>
            </ul>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            {saved !== undefined ? <SaveJobButton jobId={job.id} initialSaved={saved} /> : null}
            <Link
              href={href}
              className="t-colors inline-flex items-center rounded-full border border-[#b28a49] bg-white px-4 py-2 text-[13px] font-semibold text-[#b28a49] no-underline hover:bg-[#b28a49] hover:text-[#142438]"
            >
              {moreInfo}
            </Link>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-[#1f8f4e] hover:underline"
            >
              {expanded ? `− ${siteText(locale, 'collapse')}` : `+ ${siteText(locale, 'expand')}`}
            </button>
          </div>
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

        {expanded ? (
          <div className="rounded-[10px] border border-[#eef0f3] bg-[#f7f8fa] px-4 py-3 text-[14px] leading-[1.55] text-ink-2">
            {job.summary ? <p className="m-0">{job.summary}</p> : null}
            <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
              <li>
                <span className="font-medium text-[#142438]">{siteText(locale, 'Housing')}:</span>{' '}
                {siteText(locale, HOUSING_LABELS[job.housing])}
              </li>
              {job.mealsIncluded ? (
                <li>
                  <span className="font-medium text-[#142438]">{siteText(locale, 'Meals')}:</span> {siteText(locale, 'Included')}
                </li>
              ) : null}
              {job.visaSponsored ? (
                <li>
                  <span className="font-medium text-[#142438]">{siteText(locale, 'Visa')}:</span> {siteText(locale, 'Sponsored')}
                </li>
              ) : null}
              {job.employerDisplay ? (
                <li>
                  <span className="font-medium text-[#142438]">{siteText(locale, 'Employer')}:</span> {job.employerDisplay}
                </li>
              ) : null}
            </ul>
            <div className="mt-3">
              <Link href={href} className="text-[13px] font-semibold text-[#142438] underline-offset-2 hover:underline">
                {applyNow} →
              </Link>
            </div>
          </div>
        ) : job.summary ? (
          <p className="m-0 line-clamp-2 text-[14px] leading-[1.5] text-ink-2">{job.summary}</p>
        ) : null}

        <div className="mt-1 flex flex-col gap-3 border-t border-[#eef0f3] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-[14px] font-semibold text-[#142438]">
            {salary ? (
              <>
                <span className="font-medium text-ink-2">{siteText(locale, 'Basic Salary')}:</span> {salary}
              </>
            ) : (
              siteText(locale, 'Salary on request')
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {shares.map((share) => (
              <a
                key={share.name}
                href={share.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${siteText(locale, 'Share on')} ${share.name}`}
                title={share.name}
                className={`grid size-8 place-items-center rounded-full no-underline ${share.className}`}
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
                  {share.icon}
                </svg>
              </a>
            ))}
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#e2e5ea] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#142438] hover:border-[#142438]"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <rect x="8" y="8" width="11" height="11" rx="2" />
                <path d="M5 16V6a2 2 0 012-2h10" strokeLinecap="round" />
              </svg>
              {copied ? siteText(locale, 'Copied') : siteText(locale, 'Copy')}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function MetaIcon({ kind }: { kind: 'experience' | 'location' | 'date' | 'code' }) {
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
  if (kind === 'code') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 8h16v11H4z M9 8V5h6v3" />
    </svg>
  );
}
