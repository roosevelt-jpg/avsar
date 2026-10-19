'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { APPLICATION_STATUSES, STATUS_META, type ApplicationStatus } from '@/lib/applications/status';

const INPUT = 'w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink';

/**
 * Move an application, leave a note, rate it.
 *
 * "Visible to candidate" defaults on for moves and off for plain notes,
 * because the common mistake is the other way round: an internal remark
 * landing in a candidate's tracker.
 */
export function ApplicationActions({ id, status, rating }: { id: string; status: ApplicationStatus; rating: number | null }) {
  const router = useRouter();
  const [next, setNext] = useState<ApplicationStatus>(status);
  const [note, setNote] = useState('');
  const [visible, setVisible] = useState(false);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const moving = next !== status;

  async function submit(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (response.ok) {
      setNote('');
      setMessage('Saved.');
      router.refresh();
    } else {
      setMessage(data?.error === 'not_configured' ? 'The database is not connected, so nothing was saved.' : data?.error === 'forbidden' ? 'Your role cannot change applications.' : 'Could not save.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[16px] border border-line bg-surface p-4">
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Move to stage</p>
        <select className={`${INPUT} mt-2`} value={next} onChange={(e) => { setNext(e.target.value as ApplicationStatus); setVisible(e.target.value !== status); }}>
          {APPLICATION_STATUSES.map((value) => (
            <option key={value} value={value}>{STATUS_META[value].label}</option>
          ))}
        </select>
        {moving && <p className="m-0 mt-2 text-[13px] text-ink-2">The candidate will see: “{STATUS_META[next].candidateBody}”</p>}

        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[13px] text-ink-2">{moving ? 'Message to the candidate (optional)' : 'Note'}</span>
          <textarea className={INPUT} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={moving ? 'e.g. Interview on 16 October at 14:00 IST, link by email.' : 'Internal note about this candidate'} />
        </label>
        <label className="mt-3 flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Visible to the candidate
        </label>
        {moving && visible && (
          <label className="mt-1.5 flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email the candidate
          </label>
        )}
        <button
          type="button"
          disabled={busy || (!moving && !note.trim())}
          onClick={() => submit({ status: moving ? next : undefined, note: note.trim() || undefined, visibleToCandidate: visible, notify })}
          className="mt-4 w-full cursor-pointer rounded-full border-0 bg-ink px-4 py-2.5 text-[14px] font-medium text-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Saving…' : moving ? `Move to ${STATUS_META[next].label}` : 'Add note'}
        </button>
        {message && <p className="m-0 mt-2 text-[13px] text-ink-2">{message}</p>}
      </section>

      <section className="rounded-[16px] border border-line bg-surface p-4">
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Your rating</p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} of 5`}
              onClick={() => submit({ rating: value === rating ? null : value })}
              className={`cursor-pointer rounded-[8px] border px-2.5 py-1 text-[16px] ${rating && value <= rating ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-muted'}`}
            >
              ★
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
