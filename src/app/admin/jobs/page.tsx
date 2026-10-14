import Link from 'next/link';
import { AdminButton, AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { Mono } from '@/components/ui/Mono';
import { listAllJobs } from '@/lib/jobs/data';
import { JOB_STATUSES, formatSalary, type JobStatus } from '@/lib/jobs/types';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Jobs' };

const TONE: Record<JobStatus, 'success' | 'neutral' | 'muted' | 'accent'> = {
  published: 'success',
  draft: 'accent',
  closed: 'neutral',
  archived: 'muted',
};

export default async function AdminJobs({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const access = await requirePermission('jobs.view', '/admin/jobs');
  const { status: raw } = await searchParams;
  const status = (JOB_STATUSES as readonly string[]).includes(raw ?? '') ? (raw as JobStatus) : 'all';
  const jobs = await listAllJobs(status);

  return (
    <AdminShell current="/admin/jobs" isStaff>
      <AdminHeading
        title="Jobs"
        lead="Every posting, its status and its pipeline. Drafts are invisible to candidates until published."
        actions={can(access, 'jobs.edit') ? <AdminButton href="/admin/jobs/new">Post a job</AdminButton> : null}
      />

      <nav aria-label="Filter" className="mt-6 flex flex-wrap gap-2">
        {(['all', ...JOB_STATUSES] as const).map((value) => (
          <Link
            key={value}
            href={value === 'all' ? '/admin/jobs' : `/admin/jobs?status=${value}`}
            className={`rounded-full border px-3 py-1 text-[13px] capitalize no-underline ${status === value ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2 hover:border-ink'}`}
          >
            {value}
          </Link>
        ))}
      </nav>

      {jobs.length === 0 ? (
        <AdminEmpty>No jobs here yet. Post one, or run supabase/seed/jobs_sample.sql for example drafts.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-6 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[860px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line text-start">
                {['Job', 'Status', 'Salary', 'Applications', 'New', 'Updated'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-line-soft last:border-0 hover:bg-surface-hover">
                  <td className="px-4 py-3">
                    <Link href={`/admin/jobs/${job.id}`} className="font-medium text-ink no-underline hover:text-employer">{job.title}</Link>
                    <span className="block text-[13px] text-muted">{job.city} · {job.employerDisplay || 'no employer label'}{job.featured ? ' · featured' : ''}</span>
                  </td>
                  <td className="px-4 py-3"><Pill tone={TONE[job.status]}>{job.status}</Pill></td>
                  <td className="px-4 py-3 text-ink-2">{formatSalary(job) ?? '-'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/applications?job=${job.id}`} className="text-ink no-underline hover:text-employer">{job.pipeline.total}</Link>
                    {job.pipeline.offers > 0 && <span className="ms-2 text-[12px] text-muted">{job.pipeline.offers} offers</span>}
                  </td>
                  <td className="px-4 py-3">{job.pipeline.submitted > 0 ? <Pill tone="accent">{job.pipeline.submitted}</Pill> : <span className="text-muted">0</span>}</td>
                  <td className="px-4 py-3"><Mono className="text-muted">{new Date(job.updatedAt).toLocaleDateString('en-GB')}</Mono></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
