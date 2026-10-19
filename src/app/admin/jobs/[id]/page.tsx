import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminButton, AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { JobForm } from '@/components/admin/jobs/JobForm';
import { getVacancyRequest } from '@/lib/employer/portal';
import { employerOptions } from '@/lib/jobs/admin';
import { getJobById } from '@/lib/jobs/data';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Edit job' };

export default async function EditJob({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requirePermission('jobs.view', `/admin/jobs/${id}`);
  const [job, employers, request] = await Promise.all([getJobById(id), employerOptions(), getVacancyRequest(id)]);
  if (!job) notFound();

  return (
    <AdminShell current="/admin/jobs" isStaff>
      <Link href="/admin/jobs" className="font-mono text-[12px] text-muted no-underline hover:text-ink">← All jobs</Link>
      <div className="mt-4">
        <AdminHeading
          title={`${job.title}, ${job.city}`}
          actions={can(access, 'applications.view') ? <AdminButton href={`/admin/applications?job=${job.id}`} variant="light">See applications</AdminButton> : null}
        />
      </div>
      {/* The employer's own words stay beside the posting, so whoever writes
          the candidate-facing text can check it against what was asked for. */}
      {request && (
        <section aria-label="Employer request" className="mt-6 max-w-[760px] rounded-[14px] border border-line bg-surface-subtle p-5">
          <p className="m-0 text-[15px] font-semibold">
            Requested by {request.employerName} on {new Date(request.requestedAt).toLocaleDateString('en-GB')}
          </p>
          <p className="mt-2 mb-0 whitespace-pre-line text-[14px] leading-[1.6] text-ink-2">
            {request.note || 'No note. The role, city, contract, salary and housing above are as the employer entered them.'}
          </p>
          {job.status === 'draft' && (
            <p className="mt-2 mb-0 text-[13px] text-muted">
              Write the summary and description, decide what candidates see as the employer name, confirm the details with the employer, then publish.
            </p>
          )}
        </section>
      )}
      <div className="mt-6">
        {can(access, 'jobs.edit') ? (
          <JobForm job={job} employers={employers} canPublish={can(access, 'jobs.publish')} />
        ) : (
          <p className="text-[15px] text-ink-2">You can view this job but your role cannot edit it.</p>
        )}
      </div>
    </AdminShell>
  );
}
