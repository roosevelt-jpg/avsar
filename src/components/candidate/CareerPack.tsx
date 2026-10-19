'use client';

import { localePath } from '@/lib/i18n/path';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import type { CareerPack as Pack } from '@/lib/cv/coach-schema';
import { CV_TEMPLATES, type CvTemplate } from '@/lib/report/CvDocument';

/**
 * The career pack, shown to the candidate.
 *
 * This is the part of the fee they keep. It has to read as a document they
 * own rather than as a feature of our platform, because that is what it is:
 * useful to them with any employer, whether or not we ever place them.
 */
export function CareerPack({
  pack,
  canGenerate,
  locale,
}: {
  pack: Pack | null;
  canGenerate: boolean;
  locale: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [template, setTemplate] = useState<CvTemplate>('standard');

  async function generate() {
    setState('working');
    setMessage('');
    try {
      const response = await fetch('/api/career-pack', { method: 'POST' });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? String(response.status));
      }
      router.refresh();
      setState('idle');
    } catch (error) {
      setState('error');
      setMessage(
        error instanceof Error && error.message === 'report_not_ready'
          ? 'Your report is not ready yet. This becomes available with it.'
          : 'We could not build it just now. Please try again in a moment.',
      );
    }
  }

  if (!pack) {
    return (
      <section className="rounded-[20px] border border-line bg-surface p-[clamp(22px,2.8cqi,32px)]">
        <Mono className="text-muted">INCLUDED WITH YOUR ASSESSMENT</Mono>
        <h2 className="mt-3 mb-3 text-[clamp(21px,2.6cqi,28px)] font-semibold leading-[1.2]">
          Your career pack
        </h2>
        <p className="m-0 mb-6 max-w-[58ch] text-[16px] leading-[1.6] text-ink-2">
          A rewritten CV built from your own experience, preparation for the questions you will
          actually be asked, and what to work on next. It is yours to keep and use with any
          employer, anywhere.
        </p>
        <button
          type="button"
          onClick={generate}
          disabled={!canGenerate || state === 'working'}
          className="t-colors cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === 'working' ? 'Building it…' : 'Build my career pack'}
        </button>
        {state === 'working' && (
          <p className="mt-3 mb-0 text-[13px] text-muted">This takes up to a minute.</p>
        )}
        {state === 'error' && <p className="mt-3 mb-0 text-[14px] text-accent-deep">{message}</p>}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <Mono className="text-muted">YOUR CAREER PACK</Mono>
        <h2 className="mt-3 mb-0 text-[clamp(22px,3cqi,32px)] font-semibold leading-[1.15] tracking-[-0.02em]">
          What to lead with, and what to work on
        </h2>
      </div>

      {/* The candidate's own language first when we have it: this is the part
          they act on, and it lands better read in the language they think in. */}
      {pack.translated && (
        <div className="rounded-[20px] border border-accent bg-accent-tint p-[clamp(20px,2.6cqi,28px)]">
          <Mono className="text-accent-deep">{pack.translated.language.toUpperCase()}</Mono>

          <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0" lang="hi">
            {pack.translated.strengths.map((item) => (
              <li key={item.title}>
                <p className="m-0 text-[16px] font-medium leading-[1.5]">{item.title}</p>
                <p className="m-0 mt-1 text-[15px] leading-[1.7] text-ink-2">{item.why}</p>
              </li>
            ))}
          </ul>

          <ul className="m-0 mt-5 flex list-none flex-col gap-3 border-t border-line pt-5 p-0" lang="hi">
            {pack.translated.improvements.map((item) => (
              <li key={item.area}>
                <p className="m-0 text-[15px] font-medium leading-[1.5]">{item.area}</p>
                <p className="m-0 mt-1 text-[15px] leading-[1.7] text-ink-2">{item.action}</p>
              </li>
            ))}
          </ul>

          <ul className="m-0 mt-5 flex list-none flex-col gap-3 border-t border-line pt-5 p-0" lang="hi">
            {pack.translated.questions.map((item) => (
              <li key={item.question}>
                <p className="m-0 text-[15px] font-medium leading-[1.5]">{item.question}</p>
                <p className="m-0 mt-1 text-[15px] leading-[1.7] text-ink-2">{item.approach}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --------------------------------------------------------- strengths */}
      <div className="rounded-[20px] border border-line bg-surface p-[clamp(20px,2.6cqi,28px)]">
        <h3 className="m-0 mb-4 text-[19px] font-semibold">Your strengths</h3>
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {pack.strengths.map((item) => (
            <li key={item.title} className="border-l-2 border-accent pl-4">
              <p className="m-0 text-[16px] font-medium">{item.title}</p>
              <p className="m-0 mt-1 text-[15px] leading-[1.55] text-ink-2">{item.why}</p>
              <p className="m-0 mt-1.5 text-[13px] text-muted">{item.evidence}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ------------------------------------------------------ improvements */}
      <div className="rounded-[20px] border border-line bg-surface p-[clamp(20px,2.6cqi,28px)]">
        <h3 className="m-0 mb-4 text-[19px] font-semibold">What to work on</h3>
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {pack.improvements.map((item) => (
            <li key={item.area}>
              <Mono className="text-muted">{item.area.toUpperCase()}</Mono>
              <p className="m-0 mt-1.5 text-[16px] leading-[1.55]">{item.action}</p>
              <p className="m-0 mt-1 text-[14px] text-ink-2">{item.payoff}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* --------------------------------------------------------- interview */}
      <div className="rounded-[20px] border border-line bg-surface p-[clamp(20px,2.6cqi,28px)]">
        <h3 className="m-0 mb-4 text-[19px] font-semibold">Your interview</h3>

        <Mono className="text-muted">RAISE THESE EARLY</Mono>
        <ul className="m-0 mt-2 mb-6 list-disc pl-5 text-[15px] leading-[1.6] text-ink-2">
          {pack.interview.leadWith.map((item) => <li key={item}>{item}</li>)}
        </ul>

        <Mono className="text-muted">QUESTIONS YOU WILL BE ASKED</Mono>
        <ul className="m-0 mt-2 mb-6 flex list-none flex-col gap-4 p-0">
          {pack.interview.questions.map((item) => (
            <li key={item.question} className="rounded-[14px] bg-surface-subtle p-4">
              <p className="m-0 text-[15px] font-medium">{item.question}</p>
              <p className="m-0 mt-1.5 text-[14px] leading-[1.55] text-ink-2">{item.approach}</p>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          <div>
            <Mono className="text-muted">PREPARE FOR</Mono>
            <ul className="m-0 mt-2 list-disc pl-5 text-[14px] leading-[1.6] text-ink-2">
              {pack.interview.prepareFor.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div>
            <Mono className="text-muted">ASK THEM</Mono>
            <ul className="m-0 mt-2 list-disc pl-5 text-[14px] leading-[1.6] text-ink-2">
              {pack.interview.askThem.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ improved CV */}
      <div className="rounded-[20px] border border-night bg-night p-[clamp(20px,2.6cqi,28px)] text-on-night">
        <h3 className="m-0 mb-3 text-[19px] font-semibold">Your rewritten CV</h3>

        <p className="m-0 mb-6 max-w-[60ch] text-[14px] leading-[1.6] text-dark-muted-2">
          Built only from what you told us. Nothing has been added that you cannot back up in an
          interview. Read it before you send it, and change anything that does not sound like you.
        </p>

        {/* Format is the candidate's choice, but the default is the one that
            reads cleanly everywhere. */}
        <div role="radiogroup" aria-label="CV format" className="mb-5 flex flex-col gap-2">
          {CV_TEMPLATES.map((option) => {
            const active = template === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTemplate(option.id)}
                className="t-colors flex cursor-pointer items-start gap-3 rounded-[12px] border p-3.5 text-left"
                style={{
                  borderColor: active ? '#f7f5f0' : '#3a3833',
                  background: active ? 'rgba(247,245,240,0.08)' : 'transparent',
                }}
              >
                <span
                  aria-hidden
                  className="mt-0.5 size-[16px] shrink-0 rounded-full"
                  style={{ border: active ? '5px solid #f7f5f0' : '1.5px solid #6b675f' }}
                />
                <span>
                  <span className="block text-[15px] font-medium text-on-night">{option.name}</span>
                  <span className="block text-[13px] leading-[1.5] text-dark-muted-2">
                    {option.note}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <a
          href={localePath(locale, `/dashboard/cv.pdf?template=${template}`)}
          className="t-colors mb-6 inline-block rounded-[12px] bg-on-night px-5 py-3 text-[15px] font-medium text-night no-underline hover:bg-white"
        >
          Download as PDF
        </a>

        <div className="rounded-[16px] bg-paper p-[clamp(18px,2.4cqi,28px)] text-ink">
          <p className="m-0 text-[19px] font-semibold">{pack.improvedCv.headline}</p>
          <p className="m-0 mt-3 max-w-[70ch] text-[15px] leading-[1.6] text-ink-2">
            {pack.improvedCv.summary}
          </p>

          {pack.improvedCv.experience.map((role) => (
            <div key={`${role.employer}-${role.title}`} className="mt-6 border-t border-line pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="m-0 text-[16px] font-medium">
                  {role.title} · {role.employer}
                </p>
                <Mono className="text-muted">{role.period}</Mono>
              </div>
              <ul className="m-0 mt-2.5 list-disc pl-5 text-[15px] leading-[1.6] text-ink-2">
                {role.bullets.map((bullet) => <li key={bullet.text}>{bullet.text}</li>)}
              </ul>
            </div>
          ))}

          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 border-t border-line pt-5">
            <div>
              <Mono className="text-muted">SKILLS</Mono>
              <p className="m-0 mt-2 text-[14px] leading-[1.6] text-ink-2">
                {pack.improvedCv.skills.join(' · ')}
              </p>
            </div>
            <div>
              <Mono className="text-muted">LANGUAGES</Mono>
              <p className="m-0 mt-2 text-[14px] leading-[1.6] text-ink-2">
                {pack.improvedCv.languages.join(' · ')}
              </p>
            </div>
            <div>
              <Mono className="text-muted">EDUCATION</Mono>
              <p className="m-0 mt-2 text-[14px] leading-[1.6] text-ink-2">
                {pack.improvedCv.education.join(' · ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
