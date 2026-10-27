import Link from 'next/link';
import { AdminEmpty, AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { ApplicationsTable } from '@/components/admin/ApplicationsTable';
import { applicationCounts, listApplicationsForConsole } from '@/lib/applications/data';
import { APPLICATION_STATUSES, STATUS_META, isApplicationStatus } from '@/lib/applications/status';
import { getJobById } from '@/lib/jobs/data';
import { can, requirePermission } from '@/lib/rbac/server';
import { getSiteSettings } from '@/lib/cms/data';
import { lateCreatedBefore } from '@/lib/console/due';

export const metadata = { title: 'Applications' };

type Search = { status?: string; job?: string; q?: string; page?: string; mine?: string; late?: string };

export default async function AdminApplications({ searchParams }: { searchParams: Promise<Search> }) {
  const access = await requirePermission('applications.view', '/admin/applications');
  const search = await searchParams;
  const status = search.status && isApplicationStatus(search.status) ? search.status : undefined;
  const jobId = search.job && /^[0-9a-f-]{36}$/i.test(search.job) ? search.job : undefined;
  const page = Math.max(1, Number(search.page) || 1);
  const mine = search.mine === '1';
  const late = search.late === '1';
  const { hiring } = await getSiteSettings();
  const lateBefore = late ? lateCreatedBefore(hiring.responseDays) : undefined;

  const [{ rows, total, pageSize }, counts, job] = await Promise.all([
    listApplicationsForConsole({ status: late ? 'submitted' : status, jobId, q: search.q, page, assignedTo: mine ? access.userId : undefined, lateBefore }),
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
        lead={status === 'submitted' || late ? 'Oldest application first, so a late reply is at the top. Open one to take it, set the next step, and move the stage.' : 'Newest movement first. Open one to read the answers, move the stage and message the candidate.'}
      />

      <nav aria-label="Stage" className="mt-6 flex flex-wrap gap-2">
        <Link href={href({ status: undefined, late: undefined, page: undefined })} className={`rounded-full border px-3 py-1 text-[13px] no-underline ${!status && !late ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2'}`}>
          All
        </Link>
        {APPLICATION_STATUSES.map((value) => (
          <Link
            key={value}
            href={href({ status: value, late: undefined, page: undefined })}
            className={`rounded-full border px-3 py-1 text-[13px] no-underline ${!late && status === value ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2 hover:border-ink'}`}
          >
            {STATUS_META[value].label} <span className="opacity-60">{counts[value] ?? 0}</span>
          </Link>
        ))}
      </nav>
      <nav aria-label="Queue" className="mt-3 flex flex-wrap gap-2">
        <Link href={href({ mine: mine ? undefined : '1', page: undefined })} className={`rounded-full border px-3 py-1 text-[13px] no-underline ${mine ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2'}`}>
          Mine
        </Link>
        <Link href={href({ late: late ? undefined : '1', status: undefined, page: undefined })} className={`rounded-full border px-3 py-1 text-[13px] no-underline ${late ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2'}`}>
          Late replies
        </Link>
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
        <ApplicationsTable
          rows={rows}
          total={total}
          canManage={can(access, 'applications.manage')}
          canExport={can(access, 'candidates.export')}
          viewerId={access.userId}
          responseDays={hiring.responseDays}
          exportQuery={new URLSearchParams(Object.entries({ status: late ? 'submitted' : status, job: jobId, q: search.q?.trim(), mine: mine ? '1' : undefined, late: late ? '1' : undefined }).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString()}
        />
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
