'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Starts the AI read of one CV.
 *
 * Staff-triggered rather than automatic on upload. Each read costs real money
 * per document, and a candidate who uploads the wrong file four times should
 * not be four assessments.
 */
export function RunCvAssessment({
  documentId,
  state,
}: {
  documentId: string;
  state: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const running = state === 'extracting' || state === 'rating';

  async function run() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/cv/assess', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        /* Named, not generic: "ai_unconfigured" means someone has to add a key,
           which is a different job from a document that failed to parse. */
        throw new Error(body?.error ?? String(response.status));
      }

      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'ready') {
    return <span className="font-mono text-[12px] text-success">assessed</span>;
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={busy || running}
        className="t-colors cursor-pointer rounded-[8px] border border-line-strong bg-surface px-3 py-1.5 text-[13px] hover:border-ink disabled:opacity-50"
      >
        {busy || running ? 'Reading…' : state === 'failed' ? 'Retry' : 'Read CV'}
      </button>
      {error && <span className="font-mono text-[12px] text-accent-deep">{error}</span>}
    </span>
  );
}
