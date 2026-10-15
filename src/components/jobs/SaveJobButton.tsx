'use client';

import { useState } from 'react';

/**
 * The heart on a job. Optimistic: it flips at once and flips back if the
 * server refuses, because on a slow connection a button that waits feels
 * broken. Sits above the card's stretched link, hence `relative z-10`.
 */
export function SaveJobButton({ jobId, initialSaved, className = '' }: { jobId: string; initialSaved: boolean; className?: string }) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !saved;
    setSaved(next);
    setBusy(true);
    try {
      const response = await fetch('/api/jobs/saved', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!response.ok) setSaved(!next);
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
      title={saved ? 'Saved' : 'Save'}
      className={`relative z-10 grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-white/90 shadow-sm backdrop-blur hover:text-accent ${saved ? 'text-accent' : 'text-ink'} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path
          d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 4 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.3 0 5.7 3.1 4.5 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
