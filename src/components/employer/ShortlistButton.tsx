'use client';

import { useState } from 'react';

/** Per-row shortlist toggle. Optimistic, rolls back if the write fails. */
export function ShortlistButton({ candidateId, initial = false }: { candidateId: string; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !on;
    setOn(next);
    setPending(true);
    try {
      const response = await fetch('/api/shortlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ candidateId, shortlisted: next }),
      });
      if (!response.ok) throw new Error(String(response.status));
    } catch {
      setOn(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={toggle}
      disabled={pending}
      className="t-colors cursor-pointer rounded-[8px] border px-3 py-1.5 text-[13px] disabled:opacity-60"
      style={{
        borderColor: on ? 'oklch(0.56 0.14 250)' : '#d9d4c8',
        background: on ? 'oklch(0.56 0.14 250)' : '#fff',
        color: on ? '#fff' : '#1b1a17',
      }}
    >
      {on ? 'Shortlisted' : 'Shortlist'}
    </button>
  );
}
