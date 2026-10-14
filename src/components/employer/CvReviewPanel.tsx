'use client';

import { useState } from 'react';
import { Mono } from '@/components/ui/Mono';

type Criterion = {
  id: string;
  score: number;
  evidence: string[];
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
};

type Discrepancy = {
  field: string;
  selfReported: string;
  fromDocument: string;
  severity: 'info' | 'review' | 'serious';
};

const OUTCOMES = [
  { id: 'advance', label: 'Advance' },
  { id: 'hold', label: 'Hold' },
  { id: 'needs_more_info', label: 'Needs more info' },
  { id: 'reject', label: 'Reject' },
] as const;

/**
 * The reviewer's screen.
 *
 * Two rules shape it. The suggestion is never shown without its evidence, so a
 * reviewer cannot act on a bare number. And the decision is theirs: the form
 * demands an outcome and, on any departure from the suggestion, a written
 * reason. Those reasons are what will eventually fix the rubric.
 */
export function CvReviewPanel({
  assessmentId,
  suggestedScore,
  roleFit,
  criteria,
  strengths,
  concerns,
  discrepancies,
  attentionReasons,
  rubricLabels,
  audit,
}: {
  assessmentId: string;
  suggestedScore: number;
  roleFit: string;
  criteria: Criterion[];
  strengths: string[];
  concerns: string[];
  discrepancies: Discrepancy[];
  attentionReasons: string[];
  rubricLabels: Record<string, string>;
  audit: { model: string; promptVersion: string; rubricVersion: string };
}) {
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]['id'] | null>(null);
  const [reviewerScore, setReviewerScore] = useState<string>(String(suggestedScore));
  const [reason, setReason] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const numericScore = Number(reviewerScore);
  const scoreDiffers = Number.isFinite(numericScore) && numericScore !== suggestedScore;
  const agreedWithAi = !scoreDiffers && outcome === 'advance';
  const reasonRequired = !agreedWithAi;
  const canSubmit =
    outcome !== null && (!reasonRequired || reason.trim().length >= 10) && state !== 'saving';

  async function submit() {
    if (!outcome) return;
    setState('saving');
    setMessage('');
    try {
      const response = await fetch('/api/cv/decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          outcome,
          reviewerScore: Number.isFinite(numericScore) ? numericScore : undefined,
          agreedWithAi,
          reason: reason.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? String(response.status));
      }
      setState('saved');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Could not save the decision.');
    }
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[clamp(20px,3cqi,40px)]">
      {/* ------------------------------------------------ the suggestion */}
      <section>
        <div className="mb-6 flex flex-wrap items-end gap-5 rounded-[20px] border border-line bg-surface p-[22px]">
          <div>
            <Mono className="text-muted">AI SUGGESTED SCORE</Mono>
            <p className="mt-2 mb-0 text-[40px] font-semibold leading-none tracking-[-0.03em] text-employer-deep">
              {suggestedScore}
              <span className="text-[15px] font-normal text-muted">/100</span>
            </p>
          </div>
          <div>
            <Mono className="text-muted">ROLE FIT</Mono>
            <p className="mt-2 mb-0 text-[17px] font-medium capitalize">{roleFit}</p>
          </div>
          <p className="m-0 w-full text-[13px] leading-[1.55] text-muted">
            A suggestion, not a decision. Read the evidence below before recording an outcome.
            The candidate is entitled to this reasoning on request.
          </p>
        </div>

        {attentionReasons.length > 0 && (
          <div className="mb-5 rounded-[16px] border border-accent bg-accent-tint p-4">
            <Mono className="text-accent-deep">NEEDS A HUMAN LOOK</Mono>
            <ul className="m-0 mt-2.5 list-disc pl-5 text-[14px] leading-[1.6] text-ink">
              {attentionReasons.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {discrepancies.length > 0 && (
          <div className="mb-5 rounded-[16px] border border-line bg-surface p-4">
            <Mono className="text-muted">CV VERSUS WHAT THEY TOLD US AT SIGN-UP</Mono>
            <ul className="m-0 mt-3 list-none p-0">
              {discrepancies.map((d) => (
                <li key={d.field} className="border-b border-line-soft py-2.5 last:border-b-0">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[15px] font-medium">{d.field}</span>
                    <Mono
                      className={
                        d.severity === 'serious'
                          ? 'text-accent-deep'
                          : d.severity === 'review'
                            ? 'text-ink-2'
                            : 'text-muted'
                      }
                    >
                      {d.severity}
                    </Mono>
                  </span>
                  <span className="mt-1 block text-[13px] text-muted">
                    said {d.selfReported} · CV shows {d.fromDocument}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="m-0 mb-4 text-[19px] font-semibold">Scores and evidence</h2>
        <ul className="m-0 list-none p-0">
          {criteria.map((criterion) => (
            <li key={criterion.id} className="mb-4 rounded-[16px] border border-line bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="text-[15px] font-medium">
                  {rubricLabels[criterion.id] ?? criterion.id}
                </span>
                <span className="flex items-baseline gap-3">
                  <Mono
                    className={criterion.confidence === 'low' ? 'text-accent-deep' : 'text-muted'}
                  >
                    {criterion.confidence} confidence
                  </Mono>
                  <span className="font-mono text-[17px] font-medium text-employer-deep">
                    {criterion.score}
                  </span>
                </span>
              </div>

              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
                <div className="h-full rounded-full bg-employer" style={{ width: `${criterion.score}%` }} />
              </div>

              <p className="mt-3 mb-0 text-[14px] leading-[1.6] text-ink-2">{criterion.reasoning}</p>

              {criterion.evidence.length > 0 ? (
                <ul className="m-0 mt-3 list-none border-l-2 border-line-strong pl-3.5 p-0">
                  {criterion.evidence.map((quote) => (
                    <li key={quote} className="mb-1.5 text-[13px] leading-[1.55] text-muted">
                      {quote}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 mb-0 text-[13px] text-accent-deep">
                  No evidence cited. Treat this score as unsupported.
                </p>
              )}
            </li>
          ))}
        </ul>

        {(strengths.length > 0 || concerns.length > 0) && (
          <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {strengths.length > 0 && (
              <div>
                <Mono className="text-muted">STRENGTHS</Mono>
                <ul className="m-0 mt-2 list-disc pl-5 text-[14px] leading-[1.6] text-ink-2">
                  {strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {concerns.length > 0 && (
              <div>
                <Mono className="text-muted">CONCERNS</Mono>
                <ul className="m-0 mt-2 list-disc pl-5 text-[14px] leading-[1.6] text-ink-2">
                  {concerns.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ------------------------------------------------- the decision */}
      <section>
        <div className="sticky top-6 rounded-[20px] border border-line bg-surface p-[22px]">
          <h2 className="m-0 text-[19px] font-semibold">Your decision</h2>
          <p className="mt-1.5 mb-5 text-[13px] leading-[1.55] text-muted">
            Recorded against your account. This is the decision of record.
          </p>

          <div role="radiogroup" aria-label="Outcome" className="flex flex-wrap gap-2">
            {OUTCOMES.map((option) => {
              const active = outcome === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setOutcome(option.id)}
                  className="t-colors cursor-pointer rounded-full border px-3.5 py-2 text-[14px]"
                  style={{
                    borderColor: active ? 'oklch(0.56 0.14 250)' : '#d9d4c8',
                    background: active ? 'oklch(0.56 0.14 250)' : '#fff',
                    color: active ? '#fff' : '#1b1a17',
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-[14px] font-medium">Your score</span>
            <input
              value={reviewerScore}
              onChange={(event) => setReviewerScore(event.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              maxLength={3}
              className="w-[110px] rounded-[10px] border border-line-strong bg-surface px-3 py-2.5 font-mono text-[15px] outline-none focus:border-employer t-colors"
            />
            {scoreDiffers && (
              <span className="mt-1.5 block text-[12px] text-muted">
                Differs from the suggestion by {Math.abs(numericScore - suggestedScore)} points.
                This divergence is tracked; it is how the rubric gets corrected.
              </span>
            )}
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-[14px] font-medium">
              Reason {reasonRequired ? <span className="text-accent-deep">(required)</span> : '(optional)'}
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder={
                reasonRequired
                  ? 'What did you see that the suggestion missed or got wrong?'
                  : 'Anything worth recording.'
              }
              className="w-full resize-y rounded-[10px] border border-line-strong bg-surface px-3 py-2.5 text-[14px] leading-[1.55] outline-none focus:border-employer t-colors"
            />
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="t-colors mt-5 w-full cursor-pointer rounded-[12px] border-0 bg-employer px-5 py-3 text-[15px] font-medium text-white hover:bg-employer-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state === 'saving' ? 'Recording…' : state === 'saved' ? 'Recorded' : 'Record decision'}
          </button>

          {state === 'error' && (
            <p className="mt-3 mb-0 text-[13px] text-accent-deep">{message}</p>
          )}

          <p className="mt-6 mb-0 border-t border-line-soft pt-4 font-mono text-[11px] leading-[1.7] text-muted">
            model {audit.model}
            <br />
            prompt {audit.promptVersion}
            <br />
            rubric {audit.rubricVersion}
          </p>
        </div>
      </section>
    </div>
  );
}
