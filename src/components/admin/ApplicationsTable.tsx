'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Pill } from '@/components/admin/Pill';
import { Mono } from '@/components/ui/Mono';
import { IDEMPOTENCY_HEADER, useIdempotencyKey } from '@/components/security/useIdempotencyKey';
import type { AdminApplicationRow } from '@/lib/applications/data';
import { APPLICATION_STATUSES, STATUS_META, type ApplicationStatus } from '@/lib/applications/status';
import { positionLabel } from '@/lib/data/positions';

/**
 * The applications table with row selection, a bulk stage move and CSV
 * export. Selection only exists for roles that can act on it; for everyone
 * else this is the same read-only table as before.
 */
export function ApplicationsTable({
  rows,
  canManage,
  canExport,
  exportQuery,
  total,
}: {
  rows: AdminApplicationRow[];
  canManage: boolean;
  canExport: boolean;
  /** The current filters as a query string, so "Export all" matches the screen. */
  exportQuery: string;
  total: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<ApplicationStatus>('screening');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const idempotency = useIdempotencyKey();

  const selectable = canManage || canExport;
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function move() {
    setBusy(true);
    setMessage(null);
    const body = JSON.stringify({ ids: [...selected].sort(), status: target, notify });
    const response = await fetch('/api/admin/applications/bulk', {
      method: 'POST',
      headers: { 'content-type': 'application/json', [IDEMPOTENCY_HEADER]: idempotency.current(body) },
      body,
    }).catch(() => null);
    if (!response) {
      setBusy(false);
      setMessage('The connection dropped. Press Move again: it will not be applied twice.');
      return;
    }
    idempotency.settle(response);
    const data = (await response.json().catch(() => null)) as { moved?: number; error?: string } | null;
    setBusy(false);
    if (response.ok) {
      setMessage(`${data?.moved ?? 0} moved to ${STATUS_META[target].label}.`);
      setSelected(new Set());
      router.refresh();
    } else {
      setMessage(data?.error === 'not_configured' ? 'The database is not connected, so nothing was saved.' : data?.error === 'forbidden' ? 'Your role cannot move applications.' : 'Could not move the selection.');
    }
  }

  const exportBase = `/api/admin/applications/export${exportQuery ? `?${exportQuery}` : ''}`;
  const exportSelected = `/api/admin/applications/export?ids=${[...selected].join(',')}${exportQuery ? `&${exportQuery}` : ''}`;

  return (
    <>
      {selectable && (
        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-[16px] border border-line bg-surface px-4 py-3 text-[14px]" aria-label="Bulk actions">
          <span className="text-ink-2">{selected.size ? `${selected.size} selected` : 'Select rows to act on them'}</span>
          {canManage && selected.size > 0 && (
            <>
              <select aria-label="Move selection to stage" value={target} onChange={(e) => setTarget(e.target.value as ApplicationStatus)} className="rounded-full border border-line bg-paper px-3 py-1.5 text-[13px]">
                {APPLICATION_STATUSES.map((value) => (
                  <option key={value} value={value}>{STATUS_META[value].label}</option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-[13px]">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Tell candidates
              </label>
              <button type="button" disabled={busy} onClick={move} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-1.5 text-[13px] text-paper disabled:opacity-50">
                {busy ? 'Moving…' : 'Move'}
              </button>
            </>
          )}
          {canExport && (
            <span className="ms-auto flex gap-3 text-[13px]">
              {selected.size > 0 && <a href={exportSelected} className="prose-link">Export selected (CSV)</a>}
              <a href={exportBase} className="prose-link">Export all {total} (CSV)</a>
            </span>
          )}
          {message && <span className="basis-full text-[13px] text-ink-2" role="status">{message}</span>}
        </div>
      )}

      <div className="scroll-x mt-3 rounded-[16px] border border-line bg-surface">
        <table className="w-full min-w-[900px] border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-line">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)))}
                  />
                </th>
              )}
              {['Candidate', 'Job', 'Stage', 'Package', 'Rating', 'Applied', 'Last move'].map((h) => (
                <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={`border-b border-line-soft last:border-0 hover:bg-surface-hover ${selected.has(row.id) ? 'bg-surface-hover' : ''}`}>
                {selectable && (
                  <td className="px-4 py-3">
                    <input type="checkbox" aria-label={`Select ${row.candidate.fullName}`} checked={selected.has(row.id)} onChange={() => toggle(row.id)} />
                  </td>
                )}
                <td className="px-4 py-3">
                  <Link href={`/admin/applications/${row.id}`} className="font-medium text-ink no-underline hover:text-employer">{row.candidate.fullName}</Link>
                  <span className="block text-[12px] text-muted">{row.candidate.cityState ?? '-'} · {row.candidate.position ? positionLabel(row.candidate.position) : 'no role'}</span>
                </td>
                <td className="px-4 py-3 text-ink-2">{row.job.title}<span className="block text-[12px] text-muted">{row.job.city}</span></td>
                <td className="px-4 py-3">
                  <Pill tone={STATUS_META[row.status].tone === 'success' ? 'success' : STATUS_META[row.status].tone === 'stopped' ? 'muted' : row.status === 'submitted' ? 'accent' : 'neutral'}>
                    {STATUS_META[row.status].label}
                  </Pill>
                </td>
                <td className="px-4 py-3">{row.candidate.paymentStatus === 'paid' ? <Pill tone="dark">Bought</Pill> : <span className="text-[12px] text-muted">no</span>}</td>
                <td className="px-4 py-3 text-employer">{row.rating ? '★'.repeat(row.rating) : <span className="text-muted">-</span>}</td>
                <td className="px-4 py-3"><Mono className="text-muted">{new Date(row.createdAt).toLocaleDateString('en-GB')}</Mono></td>
                <td className="px-4 py-3"><Mono className="text-muted">{new Date(row.statusChangedAt).toLocaleDateString('en-GB')}</Mono></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
