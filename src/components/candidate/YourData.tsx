'use client';

import { useState } from 'react';

/**
 * The candidate's own data rights, where they look for them: next to the
 * profile. Download is immediate. Deletion is a request a person answers,
 * because erasing someone in the middle of a visa file would break it, and
 * that deserves an explanation rather than a refusal from a button.
 */
export function YourData({ demo = false }: { demo?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');

  async function request(kind: 'erase' | 'correct') {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/candidate/privacy-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, message: note.trim() || undefined }),
      });
      const data = (await response.json().catch(() => null)) as { status?: string; error?: string } | null;
      setMessage(
        data?.status === 'requested'
          ? 'Received. We will reply by email within one month, usually much sooner.'
          : data?.status === 'already_requested'
            ? 'You already have an open request. We will reply by email.'
            : data?.error === 'demo_mode'
              ? 'This is a preview: nothing is saved.'
              : 'The request could not be sent. Please try again, or write to us from the contact page.',
      );
      if (response.ok) {
        setAsking(false);
        setNote('');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-[20px] border border-line bg-surface p-[clamp(18px,2.4cqi,26px)]">
      <h2 className="m-0 text-[19px] font-semibold">Your data</h2>
      <p className="mt-2 mb-4 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
        You can download everything we hold about you, and ask us to correct or delete it. Deleting removes your
        account, CV and applications; payment records stay because tax law requires it.
      </p>
      <div className="flex flex-wrap gap-2">
        {demo ? (
          <span className="rounded-full border border-line-strong px-4 py-2 text-[14px] text-muted">Download my data (not in preview)</span>
        ) : (
          /* A file from a route handler, not a page: client-side navigation
             would try to render it, so this stays a plain link. */
          <a href="/api/candidate/export" download className="rounded-full border border-line-strong bg-paper px-4 py-2 text-[14px] text-ink no-underline hover:border-ink">
            Download my data
          </a>
        )}
        <button type="button" onClick={() => setAsking((v) => !v)} className="cursor-pointer rounded-full border border-line-strong bg-paper px-4 py-2 text-[14px]">
          Correct or delete my data
        </button>
      </div>

      {asking && (
        <div className="mt-4 max-w-[560px]">
          <label className="block">
            <span className="mb-1.5 block text-[14px]">Anything we should know (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={3} className="w-full rounded-[12px] border border-line-strong bg-paper px-3.5 py-3 text-[16px]" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void request('correct')} className="cursor-pointer rounded-full border border-line-strong bg-paper px-4 py-2 text-[14px] disabled:opacity-40">
              Ask for a correction
            </button>
            <button type="button" disabled={busy} onClick={() => void request('erase')} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper disabled:opacity-40">
              Ask to delete my data
            </button>
          </div>
        </div>
      )}

      {message && <p role="status" className="mt-3 mb-0 text-[14px] text-ink-2">{message}</p>}
    </section>
  );
}
