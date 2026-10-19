'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CARD } from './ui';

/**
 * Shows which settings sections and pages are still running on the starter
 * content in code, and copies them into the database in one step.
 */
export function StarterContent({ missingSettings, missingPages }: { missingSettings: string[]; missingPages: string[] }) {
  const router = useRouter();
  const [state, setState] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = missingSettings.length + missingPages.length;

  async function load() {
    setBusy(true);
    setState('Loading…');
    try {
      const response = await fetch('/api/admin/setup/starter-content', { method: 'POST' });
      const data = (await response.json().catch(() => null)) as { settings?: number; pages?: number; error?: string } | null;
      setState(response.ok ? `Loaded ${data?.settings ?? 0} settings sections and ${data?.pages ?? 0} pages.` : 'Could not load the starter content.');
      if (response.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (pending === 0) return null;
  return (
    <section className={`${CARD} border-accent/50 bg-accent-tint`}>
      <h2 className="m-0 text-[17px] font-semibold">Starter content not loaded yet</h2>
      <p className="m-0 mt-1 text-[13px] leading-[1.5] text-ink-2">
        These are still showing the starter text that ships with the platform. Load it into the database so every word
        is yours to edit and nothing depends on the code. Anything already saved is left exactly as it is.
      </p>
      <ul className="m-0 mt-3 flex flex-wrap gap-1.5 p-0">
        {[...missingSettings.map((key) => `Settings: ${key}`), ...missingPages.map((slug) => `Page: ${slug}`)].map((item) => (
          <li key={item} className="list-none rounded-full bg-surface px-2.5 py-1 font-mono text-[11px]">{item}</li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" disabled={busy} onClick={load} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] font-medium text-paper disabled:opacity-40">
          Load starter content
        </button>
        {state && <span role="status" className="text-[13px] text-ink-2">{state}</span>}
      </div>
    </section>
  );
}
