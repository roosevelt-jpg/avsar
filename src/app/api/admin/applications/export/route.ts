import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { listApplicationsForConsole, type AdminApplicationRow } from '@/lib/applications/data';
import { STATUS_META, isApplicationStatus } from '@/lib/applications/status';
import { positionLabel } from '@/lib/data/positions';
import { toCsv } from '@/lib/csv';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const uuid = z.string().uuid();
const MAX_PAGES = 40;

/**
 * Applications as CSV: the selected rows, or everything matching the current
 * filters. Contact details leave the system here, so it needs
 * candidates.export (not just applications.view) and every export is audited
 * with its row count and filters.
 */
export async function GET(request: Request) {
  const guard = await apiPermission('candidates.export');
  if (guard instanceof NextResponse) return guard;

  const url = new URL(request.url);
  const ids = new Set((url.searchParams.get('ids') ?? '').split(',').filter((id) => uuid.safeParse(id).success));
  const rawStatus = url.searchParams.get('status') ?? '';
  const status = isApplicationStatus(rawStatus) ? rawStatus : undefined;
  const rawJob = url.searchParams.get('job') ?? '';
  const jobId = uuid.safeParse(rawJob).success ? rawJob : undefined;
  const q = url.searchParams.get('q')?.slice(0, 100) || undefined;

  /* Page through the same query the console list uses, so the export is
     exactly what the screen shows. Capped at 2,000 rows per file. */
  const rows: AdminApplicationRow[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await listApplicationsForConsole({ status, jobId, q, page });
    rows.push(...result.rows);
    if (rows.length >= result.total || result.rows.length < result.pageSize) break;
  }
  const selected = ids.size ? rows.filter((row) => ids.has(row.id)) : rows;

  const csv = toCsv(
    ['Reference', 'Candidate', 'Email', 'Mobile', 'From', 'Role', 'Job', 'Job city', 'Stage', 'Career package', 'Rating', 'Applied', 'Last move'],
    selected.map((row) => [
      row.reference,
      row.candidate.fullName,
      row.candidate.email,
      row.candidate.phone,
      row.candidate.cityState,
      row.candidate.position ? positionLabel(row.candidate.position) : '',
      row.job.title,
      row.job.city,
      STATUS_META[row.status].label,
      row.candidate.paymentStatus === 'paid' ? 'Bought' : 'No',
      row.rating,
      row.createdAt.slice(0, 10),
      row.statusChangedAt.slice(0, 10),
    ]),
  );

  await audit(guard.userId, 'applications.export', `applications:${selected.length}`, {
    selected: ids.size || undefined,
    status,
    jobId,
    q,
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="applications-${stamp}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
