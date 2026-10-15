'use client';

import { useState } from 'react';

/**
 * "Visible to employers" switch, 46x26. The candidate can hide their profile at
 * any time, which the FAQ promises, so this has to be real rather than cosmetic.
 */
export function VisibilityToggle({
  label,
  note,
  initial = true,
  endpoint = '/api/candidate/visibility',
  field = 'visible',
}: {
  label: string;
  note: string;
  initial?: boolean;
  /** The same switch serves other per-candidate preferences, e.g. WhatsApp updates. */
  endpoint?: string;
  field?: string;
}) {
  const [on, setOn] = useState(initial);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !on;
    setOn(next);
    setPending(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ [field]: next }),
      });
      if (!response.ok) setOn(!next);
    } catch {
      setOn(!next); // Roll back so the switch never lies about stored state.
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-line bg-surface p-[clamp(20px,2.4cqi,26px)]">
      <div>
        <p className="m-0 text-[17px] font-semibold">{label}</p>
        <p className="m-0 mt-1 text-[14px] leading-[1.5] text-muted">{note}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={toggle}
        disabled={pending}
        className="t-colors flex h-[26px] w-[46px] shrink-0 cursor-pointer items-center rounded-full border-0 p-[3px]"
        style={{ background: on ? 'oklch(0.62 0.14 150)' : 'var(--color-line-strong)', justifyContent: on ? 'flex-end' : 'flex-start' }}
      >
        <span aria-hidden className="size-[20px] rounded-full bg-white" />
      </button>
    </div>
  );
}
