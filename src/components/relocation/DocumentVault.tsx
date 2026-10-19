'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { RelocationDocument } from '@/lib/relocation/data';
import { DOCUMENT_HINTS, DOCUMENT_KINDS, DOCUMENT_LABELS, DOCUMENT_MAX_BYTES, type DocumentKind } from '@/lib/relocation/documents';

const STATUS: Record<RelocationDocument['status'], { label: string; tone: string }> = {
  uploaded: { label: 'Waiting for our check', tone: 'bg-canvas text-ink-2' },
  verified: { label: 'Checked', tone: 'bg-success/15 text-[oklch(0.42_0.12_150)]' },
  rejected: { label: 'Needs a new upload', tone: 'bg-accent-tint text-accent-deep' },
};

/**
 * One row per document kind: what it is, where it stands, and an upload
 * button. Uploading again replaces the previous file. A rejected document
 * says why, in the recruiter's words, so the next upload is the right one.
 */
export function DocumentVault({ documents }: { documents: RelocationDocument[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<DocumentKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const byKind = new Map(documents.map((d) => [d.kind, d]));

  async function upload(kind: DocumentKind, input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setError(null);
    if (file.size > DOCUMENT_MAX_BYTES) return setError('That file is over 10 MB. A photo from your phone or a scanned PDF is usually much smaller.');
    setBusy(kind);
    const form = new FormData();
    form.set('file', file);
    form.set('kind', kind);
    try {
      const response = await fetch('/api/relocation/documents', { method: 'POST', body: form });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.ok) return router.refresh();
      setError(
        data?.error === 'not_configured'
          ? 'This is a preview: nothing is uploaded.'
          : data?.error === 'unsupported_type'
            ? 'Please upload a PDF, JPG, PNG or WebP file.'
            : 'The upload did not work. Please try again.',
      );
    } catch {
      setError('The connection dropped. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6">
      <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
        {DOCUMENT_KINDS.filter((k) => k !== 'other').map((kind) => {
          const doc = byKind.get(kind);
          return (
            <li key={kind} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-[220px] flex-1">
                <p className="m-0 text-[15px] font-medium">{DOCUMENT_LABELS[kind]}</p>
                <p className="m-0 text-[13px] text-muted">{DOCUMENT_HINTS[kind]}</p>
                {doc?.status === 'rejected' && doc.rejectReason && <p className="mt-1 mb-0 text-[13px] text-accent-deep">{doc.rejectReason}</p>}
                {doc?.status === 'verified' && doc.expiresOn && <p className="mt-1 mb-0 text-[13px] text-muted">Valid until {new Date(doc.expiresOn).toLocaleDateString('en-GB')}</p>}
              </div>
              {doc && <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${STATUS[doc.status].tone}`}>{STATUS[doc.status].label}</span>}
              {doc && (
                <a href={`/api/relocation/documents/${doc.id}`} target="_blank" rel="noreferrer" className="text-[13px]">View</a>
              )}
              <label className={`cursor-pointer rounded-full border border-line-strong bg-paper px-3.5 py-1.5 text-[13px] ${busy ? 'opacity-50' : 'hover:border-ink'}`}>
                {busy === kind ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
                <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" disabled={busy !== null} onChange={(e) => void upload(kind, e.currentTarget)} />
              </label>
            </li>
          );
        })}
      </ul>
      {error && <p role="alert" className="mt-3 mb-0 text-[14px] text-accent-deep">{error}</p>}
      <p className="mt-3 mb-0 text-[13px] text-muted">
        Only our relocation team sees these files. They are deleted with your account if you ask us to delete your data.
      </p>
    </div>
  );
}
