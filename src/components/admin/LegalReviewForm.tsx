'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { LegalReview } from '@/lib/legal/review';

const FIELDS = [
  { key: 'summary', label: 'Summary', hint: 'What the documents show, in plain words the candidate will understand.' },
  { key: 'requirements', label: 'Immigration requirements for Portugal', hint: 'What their visa route needs, for their role.' },
  { key: 'missingDocuments', label: 'Missing documents', hint: 'What to get, where from, and when.' },
  { key: 'issues', label: 'Issues needing further assessment', hint: 'Write "None found" if there are none.' },
] as const;

type Draft = Pick<LegalReview, 'summary' | 'requirements' | 'missingDocuments' | 'issues'>;

/** Draft, then deliver. Delivery emails the candidate and locks the review. */
export function LegalReviewForm({ candidateId, initial }: { candidateId: string; initial: Draft }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function send(action: 'save' | 'deliver') {
    if (action === 'deliver' && !window.confirm('Deliver this review? The candidate is emailed and it can no longer be edited.')) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/legal-reviews/${candidateId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, ...draft }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.ok) {
        setMessage(action === 'deliver' ? 'Delivered.' : 'Draft saved.');
        router.refresh();
      } else if (data?.error === 'not_configured') {
        setMessage('The database is not connected, so nothing was saved.');
      } else if (data?.error === 'summary_and_requirements_required') {
        setMessage('Write the summary and the requirements before delivering.');
      } else {
        setMessage(`Not saved (${data?.error ?? response.status}).`);
      }
    } catch {
      setMessage('The connection dropped. Try again.');
    }
    setBusy(false);
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {FIELDS.map((field) => (
        <label key={field.key} className="text-[14px]">
          <span className="block font-medium">{field.label}</span>
          <span className="block text-[12px] text-muted">{field.hint}</span>
          <textarea
            rows={3}
            maxLength={4000}
            value={draft[field.key]}
            onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
            className="mt-1 w-full rounded-[10px] border border-line-strong bg-paper px-3 py-2 text-[14px]"
          />
        </label>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void send('save')} className="cursor-pointer rounded-full border border-line-strong bg-paper px-4 py-2 text-[13px] disabled:opacity-40">
          Save draft
        </button>
        <button type="button" disabled={busy} onClick={() => void send('deliver')} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[13px] text-paper disabled:opacity-40">
          Deliver to candidate
        </button>
      </div>
      {message && <p role="status" className="m-0 text-[13px] text-ink-2">{message}</p>}
    </div>
  );
}
