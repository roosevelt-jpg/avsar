'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Two clicks, so a thumb on a phone cannot withdraw an application by accident. */
export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/applications/${applicationId}/withdraw`, { method: 'POST' });
    setBusy(false);
    if (response.ok) {
      setConfirming(false);
      router.refresh();
    } else {
      setError('This application can no longer be withdrawn here. Please contact your recruiter.');
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="cursor-pointer border-0 bg-transparent p-0 text-[14px] text-muted underline underline-offset-[3px] hover:text-ink">
        Withdraw application
      </button>
    );
  }

  return (
    <div className="rounded-[14px] border border-line bg-paper p-4">
      <p className="m-0 text-[14px] text-ink">Withdraw this application? You can apply again while the job is open.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={busy} onClick={withdraw} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper disabled:opacity-60">
          {busy ? 'Withdrawing…' : 'Yes, withdraw'}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="cursor-pointer rounded-full border border-line-strong bg-surface px-4 py-2 text-[14px] text-ink">
          Keep it
        </button>
      </div>
      {error && <p className="m-0 mt-2 text-[13px] text-accent-deep">{error}</p>}
    </div>
  );
}
