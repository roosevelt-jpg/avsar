'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IDEMPOTENCY_HEADER, useIdempotencyKey } from '@/components/security/useIdempotencyKey';

type Summary = {
  status?: string;
  error?: string;
  ready?: number;
  duplicates?: number;
  imported?: number;
  problems?: { line: number; reason: string }[];
  unmatchedColumns?: string[];
};

const MAX_BYTES = 1_000_000;

/**
 * Import a partner's CSV. "Check" reads the file and reports what would
 * happen; "Import" writes it. The two are separate so a file with half its
 * phone numbers unreadable is caught before it fills the inbox.
 */
export function LeadImport() {
  const router = useRouter();
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const idempotency = useIdempotencyKey();

  async function pick(input: HTMLInputElement) {
    setSummary(null);
    const chosen = input.files?.[0];
    if (!chosen) return setFile(null);
    if (chosen.size > MAX_BYTES) {
      setFile(null);
      return setSummary({ error: 'too_large' });
    }
    setFile({ name: chosen.name, text: await chosen.text() });
  }

  async function send(dryRun: boolean) {
    if (!file) return;
    setBusy(true);
    const body = JSON.stringify({ fileName: file.name, csv: file.text, dryRun });
    try {
      const response = await fetch('/api/admin/leads/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(dryRun ? {} : { [IDEMPOTENCY_HEADER]: idempotency.current(body) }) },
        body,
      });
      if (!dryRun) idempotency.settle(response);
      const data = ((await response.json().catch(() => null)) ?? { error: 'failed' }) as Summary;
      setSummary(data);
      if (data.status === 'imported') router.refresh();
    } catch {
      setSummary({ error: 'connection' });
    } finally {
      setBusy(false);
    }
  }

  const errorText: Record<string, string> = {
    too_large: 'That file is over 1 MB. Split it into smaller files.',
    not_configured: 'The database is not connected, so nothing was saved.',
    forbidden: 'Your role cannot import leads.',
    connection: 'The connection dropped. Press Import again: rows are never imported twice.',
  };

  return (
    <details className="mt-6 max-w-[760px] rounded-[14px] border border-line bg-surface-subtle p-4">
      <summary className="cursor-pointer text-[14px] font-medium">Import a list (CSV)</summary>
      <p className="mt-3 mb-0 text-[14px] leading-[1.6] text-ink-2">
        One row per person, with a header row. Columns we recognise include name (or first and last name), phone or
        mobile, email, position or trade, city, notes, and a WhatsApp consent column (yes or no). Numbers without a
        country code are read as Indian. People already in the inbox are skipped. From Excel, use File, Save as, CSV.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input type="file" accept=".csv,text/csv" onChange={(e) => void pick(e.currentTarget)} className="text-[14px]" />
        <button type="button" disabled={!file || busy} onClick={() => void send(true)} className="cursor-pointer rounded-full border border-line-strong bg-surface px-4 py-2 text-[14px] disabled:opacity-40">
          Check
        </button>
        <button type="button" disabled={!file || busy} onClick={() => void send(false)} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper disabled:opacity-40">
          Import
        </button>
      </div>

      {summary && (
        <div role="status" className="mt-3 text-[14px] leading-[1.6]">
          {summary.error && <p className="m-0 text-accent-deep">{errorText[summary.error] ?? 'The file could not be read.'}</p>}
          {summary.ready != null && (
            <p className="m-0">
              {summary.status === 'imported' ? `${summary.imported} imported.` : `${summary.ready} ready to import.`}{' '}
              {summary.duplicates ? `${summary.duplicates} already in the inbox, skipped. ` : ''}
              {summary.problems?.length ? `${summary.problems.length} rows need attention.` : ''}
            </p>
          )}
          {summary.unmatchedColumns && summary.unmatchedColumns.length > 0 && (
            <p className="m-0 text-muted">Columns ignored: {summary.unmatchedColumns.join(', ')}</p>
          )}
          {summary.problems && summary.problems.length > 0 && (
            <ul className="m-0 mt-2 max-h-[200px] overflow-y-auto ps-5 text-ink-2">
              {summary.problems.map((p) => (
                <li key={`${p.line}-${p.reason}`}>Line {p.line}: {p.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </details>
  );
}
