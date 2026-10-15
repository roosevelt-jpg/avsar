'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DEFAULT_CRITERIA, RECOMMENDATION_LABELS, RECOMMENDATIONS, type Recommendation } from '@/lib/hiring/scorecard';

async function send(url: string, method: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    return response.ok ? { ok: true } : { ok: false, error: data?.error ?? String(response.status) };
  } catch {
    return { ok: false, error: 'network' };
  }
}

const ERRORS: Record<string, string> = {
  demo_mode: 'Demo mode: nothing is saved.',
  no_interview_yet: 'You can score once the interview has taken place.',
  network: 'The connection dropped. Try again.',
};
const explain = (error?: string) => (error ? (ERRORS[error] ?? `Not saved (${error}).`) : null);

const button = 'cursor-pointer rounded-full border border-line-strong bg-paper px-3.5 py-1.5 text-[13px] disabled:opacity-40';
const input = 'rounded-[10px] border border-line-strong bg-paper px-3 py-1.5 text-[14px]';

/**
 * Score an interview on a few named criteria, 1 to 5 each, and say what you
 * would do next. Used by recruiters (per interview) and employers (per
 * applicant; the server picks the interview).
 */
export function ScorecardForm({ endpoint, extra, onDone }: { endpoint: string; extra: Record<string, string>; onDone?: () => void }) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const complete = DEFAULT_CRITERIA.every((c) => scores[c]) && recommendation;

  async function save() {
    if (!recommendation) return;
    setBusy(true);
    const result = await send(endpoint, 'POST', {
      ...extra,
      criteria: DEFAULT_CRITERIA.map((label) => ({ label, score: scores[label] ?? 1 })),
      recommendation,
      summary,
    });
    setBusy(false);
    setMessage(result.ok ? 'Saved.' : explain(result.error));
    if (result.ok) {
      router.refresh();
      onDone?.();
    }
  }

  return (
    <div className="flex flex-col gap-3 text-[14px]">
      {DEFAULT_CRITERIA.map((label) => (
        <fieldset key={label} className="m-0 flex flex-wrap items-center gap-2 border-0 p-0">
          <legend className="mb-1 w-full p-0 text-ink-2">{label}</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`cursor-pointer rounded-full border px-3 py-1 ${scores[label] === n ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-paper'}`}>
              <input type="radio" name={`${extra.interviewId ?? extra.applicationId}-${label}`} value={n} className="sr-only" onChange={() => setScores((s) => ({ ...s, [label]: n }))} />
              {n}
            </label>
          ))}
        </fieldset>
      ))}
      <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
        <legend className="mb-1 w-full p-0 text-ink-2">Next step</legend>
        {RECOMMENDATIONS.map((r) => (
          <label key={r} className={`cursor-pointer rounded-full border px-3 py-1 ${recommendation === r ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-paper'}`}>
            <input type="radio" name={`${extra.interviewId ?? extra.applicationId}-rec`} value={r} className="sr-only" onChange={() => setRecommendation(r)} />
            {RECOMMENDATION_LABELS[r]}
          </label>
        ))}
      </fieldset>
      <textarea value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={2000} rows={3} placeholder="What stood out, in a sentence or two" className={input} />
      <div className="flex items-center gap-3">
        <button type="button" disabled={busy || !complete} onClick={() => void save()} className={button}>Save scorecard</button>
        {message && <span role="status" className="text-[13px] text-ink-2">{message}</span>}
      </div>
    </div>
  );
}

/** Employer: ask our team to release the applicant's full name. */
export function UnlockRequestButton({ applicationId, pending }: { applicationId: string; pending: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(pending ? 'Request sent. We will get back to you.' : null);
  async function submit() {
    const result = await send('/api/employer/unlock-requests', 'POST', { applicationId, reason });
    setMessage(result.ok ? 'Request sent. We will get back to you.' : explain(result.error));
    if (result.ok) {
      setOpen(false);
      router.refresh();
    }
  }
  if (message && !open) return <span className="text-[12px] text-muted">{message}</span>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="cursor-pointer border-0 bg-transparent p-0 text-[12px] text-employer underline">Ask to see full profile</button>;
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Why, e.g. to invite to a second interview" className={`${input} text-[13px]`} />
      <div className="flex gap-2">
        <button type="button" disabled={reason.trim().length < 5} onClick={() => void submit()} className={button}>Send request</button>
        <button type="button" onClick={() => setOpen(false)} className={button}>Cancel</button>
      </div>
    </div>
  );
}

/** Staff: decide an unlock request. */
export function UnlockDecision({ id }: { id: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  async function decide(decision: 'approved' | 'declined') {
    const result = await send(`/api/admin/unlocks/${id}`, 'PATCH', { decision });
    setMessage(explain(result.error));
    if (result.ok) router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void decide('approved')} className={button}>Release name</button>
      <button type="button" onClick={() => void decide('declined')} className={button}>Decline</button>
      {message && <span role="alert" className="text-[13px] text-accent-deep">{message}</span>}
    </div>
  );
}

const FEE_ACTIONS = [
  { status: 'invoiced', label: 'Mark invoiced' },
  { status: 'paid', label: 'Mark paid' },
  { status: 'waived', label: 'Waive' },
] as const;

/** Finance: move a fee along, with the invoice number when it is sent. */
export function FeeEditor({ id, status, invoiceRef }: { id: string; status: string; invoiceRef: string | null }) {
  const router = useRouter();
  const [ref, setRef] = useState(invoiceRef ?? '');
  const [message, setMessage] = useState<string | null>(null);
  async function save(next: string) {
    const result = await send(`/api/admin/fees/${id}`, 'PATCH', { status: next, invoiceRef: ref || null });
    setMessage(explain(result.error));
    if (result.ok) router.refresh();
  }
  if (status === 'paid' || status === 'waived') return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input value={ref} onChange={(e) => setRef(e.target.value)} maxLength={60} placeholder="Invoice no." className={`${input} w-[130px]`} />
      {FEE_ACTIONS.filter((a) => a.status !== status).map((a) => (
        <button key={a.status} type="button" onClick={() => void save(a.status)} className={button}>{a.label}</button>
      ))}
      {message && <span role="alert" className="text-[13px] text-accent-deep">{message}</span>}
    </div>
  );
}
