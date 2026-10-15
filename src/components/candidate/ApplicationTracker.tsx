import Image from 'next/image';
import Link from 'next/link';
import type { CandidateApplication } from '@/lib/applications/data';
import { PIPELINE, STATUS_META, canWithdraw, pipelineIndex } from '@/lib/applications/status';
import { jobLocation } from '@/lib/jobs/types';
import { jobImage } from '@/components/jobs/JobCard';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';
import { INTERVIEW_MODE_LABELS, interviewTimes } from '@/lib/interviews/time';
import { WithdrawButton } from './WithdrawButton';

const STEP_LABELS: Record<string, string> = {
  submitted: 'Applied',
  screening: 'Review',
  shortlisted: 'Shortlist',
  interview: 'Interview',
  offer: 'Offer',
  visa_processing: 'Visa',
  relocated: 'Arrived',
};

function date(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** One application: where it is, what that means, and its history. */
export function ApplicationTracker({ application, locale }: { application: CandidateApplication; locale: Locale }) {
  const meta = STATUS_META[application.status];
  const stopped = meta.tone === 'stopped';
  const current = pipelineIndex(application.status);
  const image = jobImage(application.job);

  return (
    <article className="overflow-hidden rounded-[24px] border border-line bg-surface">
      <div className="flex flex-wrap items-start gap-4 border-b border-line p-5 sm:p-6">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-[14px] bg-canvas">
          {image ? <Image src={image} alt="" fill sizes="64px" unoptimized={!image.startsWith('/')} className="object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 font-mono text-[12px] text-muted">
            {application.reference} · applied {date(application.createdAt)}
          </p>
          <h2 className="m-0 mt-1 text-[20px] font-semibold tracking-[-0.02em]">
            <Link href={localePath(locale, `/jobs/${application.job.slug}`)} className="text-ink no-underline hover:text-accent">
              {application.job.title}
            </Link>
          </h2>
          <p className="m-0 mt-0.5 text-[14px] text-ink-2">
            {[application.job.employerDisplay, jobLocation(application.job)].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
            meta.tone === 'success'
              ? 'bg-success/15 text-[oklch(0.42_0.12_150)]'
              : meta.tone === 'stopped'
                ? 'bg-canvas text-muted'
                : meta.tone === 'progress'
                  ? 'bg-accent-tint text-accent-deep'
                  : 'bg-paper text-ink-2'
          }`}
        >
          {meta.candidateTitle}
        </span>
      </div>

      {!stopped && (
        <div className="px-5 pt-5 sm:px-6">
          <ol className="m-0 grid list-none grid-cols-7 gap-1 p-0" aria-label="Progress">
            {PIPELINE.map((step, index) => {
              const state = index < current ? 'done' : index === current ? 'now' : 'next';
              return (
                <li key={step} className="flex flex-col gap-2">
                  <span
                    className={`h-1.5 rounded-full ${state === 'done' ? 'bg-ink' : state === 'now' ? 'bg-accent' : 'bg-line'}`}
                    aria-hidden
                  />
                  <span className={`hidden text-[11px] sm:block ${state === 'next' ? 'text-muted' : 'font-medium text-ink'}`}>
                    {STEP_LABELS[step]}
                  </span>
                  <span className="sr-only">
                    {STEP_LABELS[step]}: {state === 'done' ? 'done' : state === 'now' ? 'current step' : 'not yet'}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {application.interviews.length > 0 && (
        <div className="mx-5 mt-5 flex flex-col gap-3 sm:mx-6">
          {application.interviews.map((interview) => {
            const times = interviewTimes(interview.startsAt);
            return (
              <section key={interview.id} className="rounded-[16px] border border-accent/40 bg-accent-tint px-4 py-3">
                <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-deep">
                  Interview · {INTERVIEW_MODE_LABELS[interview.mode]} · {interview.durationMinutes} min
                </p>
                <p className="m-0 mt-1 text-[16px] font-semibold">{times.india}</p>
                <p className="m-0 text-[14px] text-ink-2">{times.lisbon}</p>
                {interview.location && <p className="m-0 mt-2 text-[14px] text-ink-2">{interview.location}</p>}
                {interview.candidateMessage && <p className="m-0 mt-2 text-[14px] leading-[1.5] text-ink">{interview.candidateMessage}</p>}
                {interview.link && (
                  <a href={interview.link} target="_blank" rel="noreferrer" className="prose-link mt-2 inline-block text-[14px]">
                    Join the {interview.mode === 'video' ? 'video call' : 'interview'}
                  </a>
                )}
              </section>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">What this means</p>
          <p className="m-0 mt-2 text-[15px] leading-[1.6] text-ink">{meta.candidateBody}</p>
          {canWithdraw(application.status) && (
            <div className="mt-5">
              <WithdrawButton applicationId={application.id} />
            </div>
          )}
          {application.status === 'withdrawn' && application.job.status === 'published' && (
            <Link href={localePath(locale, `/jobs/${application.job.slug}`)} className="prose-link mt-4 inline-block text-[14px]">
              Apply again
            </Link>
          )}
        </div>
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">History</p>
          <ol className="m-0 mt-3 flex list-none flex-col p-0">
            {[...application.events].reverse().map((event, index, all) => (
              <li key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span aria-hidden className={`mt-1.5 size-2.5 shrink-0 rounded-full ${index === 0 ? 'bg-accent' : 'bg-ink'}`} />
                  {index < all.length - 1 && <span aria-hidden className="w-px flex-1 bg-line" />}
                </div>
                <div className="pb-4">
                  <p className="m-0 text-[14px] font-medium">
                    {event.toStatus ? STATUS_META[event.toStatus].candidateTitle : 'Update'}
                    <span className="ms-2 font-mono text-[12px] font-normal text-muted">{date(event.createdAt)}</span>
                  </p>
                  {event.note ? <p className="m-0 mt-1 text-[14px] leading-[1.5] text-ink-2">{event.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}
