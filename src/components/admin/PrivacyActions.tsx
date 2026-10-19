'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Export and erase. Erasure asks for the word ERASE to be typed, because it
 * cannot be undone, and says beforehand exactly what it keeps.
 */
export function PrivacyActions({
  candidateId,
  erased,
  blockingReferences,
  leadId,
}: {
  candidateId: string;
  erased: boolean;
  blockingReferences: string[];
  leadId?: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function erase() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/privacy/candidates/${candidateId}/erase`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm, ...(leadId ? { leadId } : {}) }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; references?: string[] } | null;
      if (response.ok) {
        setMessage({ ok: true, text: 'Erased. The sign-in account is deleted and the files are gone.' });
        setConfirm('');
        router.refresh();
        return;
      }
      setMessage({
        ok: false,
        text:
          data?.error === 'not_configured'
            ? 'The database is not connected, so nothing was erased.'
            : data?.error === 'active_process'
              ? `Not erased: ${data.references?.join(', ')} is at offer, contract or visa stage. Explain this to the person and erase once it has moved on.`
              : 'Erasure failed. Nothing reported as erased should be assumed gone; check the access log and try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <div className="rounded-[12px] border border-line-soft bg-surface-subtle p-4">
        <p className="m-0 text-[15px] font-medium">Export</p>
        <p className="mt-1 mb-3 text-[14px] leading-[1.55] text-ink-2">
          One JSON file with everything held about this person. Send it to the address on the account, not to a new one.
        </p>
        <a
          href={`/api/admin/privacy/candidates/${candidateId}/export`}
          className="inline-flex rounded-full border border-line-strong bg-surface px-4 py-2 text-[14px] text-ink no-underline hover:border-ink"
        >
          Download data
        </a>
      </div>

      <div className="rounded-[12px] border border-line-soft bg-surface-subtle p-4">
        <p className="m-0 text-[15px] font-medium">Erase</p>
        {erased ? (
          <p className="mt-1 mb-0 text-[14px] text-muted">Already erased.</p>
        ) : blockingReferences.length > 0 ? (
          <p className="mt-1 mb-0 text-[14px] leading-[1.55] text-accent-deep">
            Cannot be erased while {blockingReferences.join(', ')} is at offer, contract or visa stage.
          </p>
        ) : (
          <>
            <p className="mt-1 mb-3 text-[14px] leading-[1.55] text-ink-2">
              Removes name, contact details, profile, CVs, voice intro, assessments and messages, and deletes the sign-in
              account. Keeps payment records and the audit trail.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Type ERASE"
                aria-label="Type ERASE to confirm"
                className="w-[140px] rounded-full border border-line-strong bg-surface px-3 py-2 text-[14px]"
              />
              <button
                type="button"
                disabled={busy || confirm !== 'ERASE'}
                onClick={() => void erase()}
                className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper hover:bg-ink-hover disabled:opacity-40"
              >
                Erase permanently
              </button>
            </div>
          </>
        )}
      </div>

      {message && (
        <p role="status" className={`m-0 text-[14px] md:col-span-2 ${message.ok ? 'text-ink-2' : 'text-accent-deep'}`}>{message.text}</p>
      )}
    </div>
  );
}
