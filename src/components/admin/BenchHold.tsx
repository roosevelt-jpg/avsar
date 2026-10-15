'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const ERRORS: Record<string, string> = {
  not_configured: 'The database is not connected, so nothing was saved.',
  held_by_another: 'Another employer is talking to this candidate.',
  too_many_holds: 'You are holding five people already. Let one go first.',
};

/** Hold or release one bench candidate. */
export function BenchHold({ candidateId, heldByMe, heldByOther }: { candidateId: string; heldByMe: boolean; heldByOther: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(method: 'POST' | 'DELETE') {
    setBusy(true);
    try {
      const response = await fetch('/api/employer/bench-holds', { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ candidateId }) });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(response.ok ? null : (ERRORS[data?.error ?? ''] ?? 'That did not work. Try again.'));
      if (response.ok) router.refresh();
    } catch {
      setMessage('The connection dropped. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (heldByOther) return <span className="text-[13px] text-muted">On hold for another employer</span>;
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void act(heldByMe ? 'DELETE' : 'POST')}
        className="cursor-pointer rounded-full border border-line-strong bg-paper px-3.5 py-1.5 text-[13px] disabled:opacity-40"
      >
        {heldByMe ? 'Let go' : 'Hold for 3 days'}
      </button>
      {message && <span role="alert" className="text-[12px] text-accent-deep">{message}</span>}
    </div>
  );
}
