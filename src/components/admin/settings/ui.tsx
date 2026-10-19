'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const INPUT = 'w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink';
export const CARD = 'rounded-[18px] border border-line bg-surface p-5';

export function Field({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {help ? <span className="text-[12px] leading-[1.45] text-muted">{help}</span> : null}
    </label>
  );
}

export function Section({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section className={CARD}>
      <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
      {lead ? <p className="m-0 mt-1 text-[13px] leading-[1.5] text-muted">{lead}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SaveBar({ onSave, state, busy }: { onSave: () => void; state: string | null; busy?: boolean }) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <button type="button" disabled={busy} onClick={onSave} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] font-medium text-paper disabled:opacity-40">
        Save
      </button>
      {state && (
        <span role="status" className="text-[13px] text-ink-2">
          {state}
        </span>
      )}
    </div>
  );
}

const MESSAGES: Record<string, string> = {
  forbidden: 'Your role cannot change this section.',
  validation_failed: 'Please check the values: emails and links must be valid, and numbers within range.',
  not_configured: 'The database is not connected.',
};

/** Saves one settings section through /api/admin/settings and refreshes the page. */
export function useSettingsSaver(key: string) {
  const router = useRouter();
  const [state, setState] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function save(value: unknown) {
    setBusy(true);
    setState('Saving…');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setState(response.ok ? 'Saved. The live site is updated.' : (MESSAGES[data?.error ?? ''] ?? 'Could not save.'));
      if (response.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return { state, busy, save };
}

/** A whole-number input that never yields NaN. */
export function NumberInput({ value, onChange, min, max, step }: { value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      className={INPUT}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step ?? 1}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
    />
  );
}

/**
 * Money typed in whole units ("2400") and kept in minor units (240000), so the
 * person editing never has to think in paise or cents.
 */
export function MoneyInput({ minor, onChange, currency }: { minor: number; onChange: (minor: number) => void; currency: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[12px] text-muted">{currency}</span>
      <input
        className={INPUT}
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={minor / 100}
        onChange={(e) => onChange(Math.round(Number(e.target.value || 0) * 100))}
      />
    </div>
  );
}
