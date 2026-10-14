import Link from 'next/link';
import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { Mono } from '@/components/ui/Mono';
import { applicationCounts, listApplicationsForConsole } from '@/lib/applications/data';
import { APPLICATION_STATUSES, STATUS_META, isApplicationStatus } from '@/lib/applications/status';
import { getJobById } from '@/lib/jobs/data';
import { positionLabel } from '@/lib/data/positions';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Applications' };

type Search = { status?: string; job?: string; q?: string; page?: string };

export default async function AdminApplications({ searchParams }: { searchParams: Promise<Search> }) {
  await requirePermission('applications.view', '/admin/applications');
  const search = await searchParams;
  const status = search.status && isApplicationStatus(search.status) ? search.status : undefined;
  const jobId = search.job && /^[0-9a-f-]{36}$/i.test(search.job) ? search.job : undefined;
  const page = Math.max(1, Number(search.page) || 1);

  const [{ rows, total, pageSize }, counts, job] = await Promise.all([
    listApplicationsForConsole({ status, jobId, q: search.q, page }),
    applicationCounts(),
    jobId ? getJobById(jobId) : Promise.resolve(null),
  ]);

  const href = (next: Partial<Search>) => {
    const params = new URLSearchParams();
    const merged = { ...search, ...next };
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    const qs = params.toString();
    return `/admin/applications${qs ? `?${qs}` : ''}`;
  };
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell current="/admin/applications" isStaff>
      <AdminHeading
        title={job ? `Applications · ${job.title}, ${job.city}` : 'Applications'}
        lead="Newest movement first. Open one to read the answers, move the stage and message the candidate."
      />

      <nav aria-label="Stage" className="mt-6 flex flex-wrap gap-2">
        <Link href={href({ status: undefined, page: undefined })} className={`rounded-full border px-3 py-1 text-[13px] no-underline ${!status ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2'}`}>
          All
        </Link>
        {APPLICATION_STATUSES.map((value) => (
          <Link
            key={value}
            href={href({ status: value, page: undefined })}
            className={`rounded-full border px-3 py-1 text-[13px] no-underline ${status === value ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2 hover:border-ink'}`}
          >
            {STATUS_META[value].label} <span className="opacity-60">{counts[value] ?? 0}</span>
          </Link>
        ))}
      </nav>

      <form method="get" action="/admin/applications" className="mt-4 flex flex-wrap gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        {jobId && <input type="hidden" name="job" value={jobId} />}
        <input name="q" defaultValue={search.q ?? ''} placeholder="Search candidate name or email" className="w-[min(100%,340px)] rounded-full border border-line bg-surface px-4 py-2 text-[14px]" />
        <button type="submit" className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper">Search</button>
        {(search.q || jobId) && <Link href={status ? `/admin/applications?status=${status}` : '/admin/applications'} className="self-center text-[13px] text-muted">Clear</Link>}
      </form>

      {rows.length === 0 ? (
        <AdminEmpty>No applications match. They appear here the moment a candidate applies.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-6 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[900px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                {['Candidate', 'Job', 'Stage', 'Assessment', 'Rating', 'Applied', 'Last move'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line-soft last:border-0 hover:bg-surface-hover">
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
                  <td className="px-4 py-3">{row.candidate.paymentStatus === 'paid' ? <Pill tone="dark">Assessed</Pill> : <span className="text-[12px] text-muted">not yet</span>}</td>
                  <td className="px-4 py-3 text-employer">{row.rating ? '★'.repeat(row.rating) : <span className="text-muted">-</span>}</td>
                  <td className="px-4 py-3"><Mono className="text-muted">{new Date(row.createdAt).toLocaleDateString('en-GB')}</Mono></td>
                  <td className="px-4 py-3"><Mono className="text-muted">{new Date(row.statusChangedAt).toLocaleDateString('en-GB')}</Mono></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center gap-3 text-[14px]">
          {page > 1 && <Link href={href({ page: String(page - 1) })}>← Previous</Link>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages && <Link href={href({ page: String(page + 1) })}>Next →</Link>}
        </nav>
      )}
    </AdminShell>
  );
}
