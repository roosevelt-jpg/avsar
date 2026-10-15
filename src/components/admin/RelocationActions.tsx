'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DocumentKind } from '@/lib/relocation/documents';
import { MILESTONE_STATUSES, type Milestone, type MilestoneStatus } from '@/lib/relocation/milestones';

/* Documents that run out. Asking for an expiry on a photo would just be noise. */
const EXPIRING: DocumentKind[] = ['passport', 'police_clearance', 'medical', 'insurance', 'contract', 'accommodation'];

async function send(url: string, method: string, body: unknown): Promise<string | null> {
  try {
    const response = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (response.ok) return null;
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    return data?.error === 'not_configured' ? 'The database is not connected, so nothing was saved.' : `Not saved (${data?.error ?? response.status}).`;
  } catch {
    return 'The connection dropped. Try again.';
  }
}

const button = 'cursor-pointer rounded-full border border-line-strong bg-paper px-3.5 py-1.5 text-[13px] disabled:opacity-40';
const input = 'rounded-[10px] border border-line-strong bg-paper px-3 py-1.5 text-[14px]';

/** Verify with an expiry date, or reject with a reason the candidate will read. */
export function DocumentReview({ id, kind }: { id: string; kind: DocumentKind }) {
  const router = useRouter();
  const [expiresOn, setExpiresOn] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function decide(decision: 'verified' | 'rejected') {
    setBusy(true);
    const error = await send(
      `/api/admin/relocation/documents/${id}`,
      'PATCH',
      decision === 'verified' ? { decision, expiresOn: expiresOn || null } : { decision, reason },
    );
    setBusy(false);
    setMessage(error);
    if (!error) router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      {EXPIRING.includes(kind) && (
        <label className="text-[13px] text-ink-2">
          <span className="mb-1 block">Valid until</span>
          <input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} className={input} />
        </label>
      )}
      <button type="button" disabled={busy} onClick={() => void decide('verified')} className={`${button} border-success`}>Verify</button>
      <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Reason, written for the candidate" className={`${input} min-w-[240px] flex-1`} />
      <button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void decide('rejected')} className={button}>Reject</button>
      {message && <p role="alert" className="m-0 w-full text-[13px] text-accent-deep">{message}</p>}
    </div>
  );
}

export function StoryReview({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function decide(decision: 'approved' | 'rejected') {
    setBusy(true);
    const error = await send(`/api/admin/stories/${id}`, 'PATCH', { decision });
    setBusy(false);
    setMessage(error);
    if (!error) router.refresh();
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => void decide('approved')} className={button}>Publish</button>
      <button type="button" disabled={busy} onClick={() => void decide('rejected')} className={button}>Decline</button>
      {message && <p role="alert" className="m-0 w-full text-[13px] text-accent-deep">{message}</p>}
    </div>
  );
}

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
  skipped: 'Not needed',
};

/** Start the plan, from the application page. */
export function StartPlan({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function create() {
    setBusy(true);
    const error = await send('/api/admin/relocation/plans', 'POST', { applicationId, start });
    setBusy(false);
    setMessage(error);
    if (!error) router.refresh();
  }
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-[13px] text-ink-2">
        <span className="mb-1 block">Plan starts</span>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={input} />
      </label>
      <button type="button" disabled={busy} onClick={() => void create()} className={button}>Start relocation plan</button>
      {message && <p role="alert" className="m-0 w-full text-[13px] text-accent-deep">{message}</p>}
    </div>
  );
}

/** One step's controls on the application page. Saves on change. */
export function MilestoneEditor({ milestone }: { milestone: Milestone }) {
  const router = useRouter();
  const [blocker, setBlocker] = useState(milestone.blocker ?? '');
  const [message, setMessage] = useState<string | null>(null);
  async function save(body: Record<string, unknown>) {
    const error = await send(`/api/admin/relocation/milestones/${milestone.id}`, 'PATCH', body);
    setMessage(error);
    if (!error) router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select defaultValue={milestone.status} onChange={(e) => void save({ status: e.target.value, ...(e.target.value === 'blocked' ? { blocker: blocker || null } : {}) })} className={input}>
        {MILESTONE_STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      <input type="date" defaultValue={milestone.dueOn ?? ''} onChange={(e) => void save({ dueOn: e.target.value || null })} className={input} aria-label="Expected by" />
      <input
        value={blocker}
        onChange={(e) => setBlocker(e.target.value)}
        onBlur={() => blocker !== (milestone.blocker ?? '') && void save({ blocker: blocker || null })}
        maxLength={500}
        placeholder="Waiting for… (the candidate sees this)"
        className={`${input} min-w-[200px] flex-1`}
      />
      {message && <p role="alert" className="m-0 w-full text-[13px] text-accent-deep">{message}</p>}
    </div>
  );
}
