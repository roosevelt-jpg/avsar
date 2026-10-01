'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PLACEMENT_STATES, stateLabel } from '@/lib/data/placements';

/**
 * Moves a placement along.
 *
 * Staff only, and deliberately a plain select rather than a drag-and-drop
 * board: a file moving backwards is a real event (an offer withdrawn, a visa
 * refused), and a board that only goes forwards quietly teaches people to
 * record the wrong thing.
 */
export function PlacementState({ id, state }: { id: string; state: string }) {
  const router = useRouter();
  const [value, setValue] = useState(state);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function move(next: string) {
    const previous = value;
    setValue(next);
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/placements', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, state: next }),
      });
      if (!response.ok) {
        /* Put the control back where it was. Showing a state the server did not
           accept is how two people end up describing the same file differently. */
        setValue(previous);
        setError('Not saved');
        return;
      }
      router.refresh();
    } catch (caught) {
      console.error('[placement] move failed', caught);
      setValue(previous);
      setError('Not saved');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <select
        value={value}
        disabled={busy}
        onChange={(event) => void move(event.target.value)}
        aria-label="Placement state"
        className="t-colors rounded-[10px] border border-line-strong bg-surface px-2.5 py-1.5 text-[14px] outline-none focus:border-ink disabled:opacity-50"
      >
        {PLACEMENT_STATES.map((option) => (
          <option key={option} value={option}>
            {stateLabel(option)}
          </option>
        ))}
      </select>
      {error && <span className="text-[13px] text-accent-deep">{error}</span>}
    </span>
  );
}
