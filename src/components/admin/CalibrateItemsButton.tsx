'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Runs item-stat recompute for staff; no API path shown in the UI. */
export function CalibrateItemsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/assessment/calibrate', { method: 'POST' });
      if (!response.ok) {
        setMessage('Could not recompute. Try again in a moment.');
        return;
      }
      setMessage('Weights updated.');
      router.refresh();
    } catch {
      setMessage('Could not recompute. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="t-colors cursor-pointer rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink hover:border-ink disabled:opacity-40"
      >
        {busy ? 'Recomputing…' : 'Recompute weights'}
      </button>
      {message ? <span className="text-[13px] text-muted">{message}</span> : null}
    </span>
  );
}
