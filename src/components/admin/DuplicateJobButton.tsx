'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Copies a posting into a new draft and opens it, ready to change the city or dates. */
export function DuplicateJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function duplicate() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/jobs/${jobId}/duplicate`, { method: 'POST' });
    const data = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
    setBusy(false);
    if (response.ok && data?.id) {
      router.push(`/admin/jobs/${data.id}`);
      return;
    }
    setError(data?.error === 'demo_mode' ? 'Demo mode' : 'Failed');
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={duplicate} disabled={busy} className="cursor-pointer rounded-full border border-line-strong bg-surface px-3 py-1 text-[12px] text-ink disabled:opacity-50">
        {busy ? 'Copying…' : 'Duplicate'}
      </button>
      {error && <span className="text-[12px] text-muted" role="status">{error}</span>}
    </span>
  );
}
