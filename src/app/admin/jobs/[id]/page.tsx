import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminButton, AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { JobForm } from '@/components/admin/jobs/JobForm';
import { employerOptions } from '@/lib/jobs/admin';
import { getJobById } from '@/lib/jobs/data';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Edit job' };

export default async function EditJob({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requirePermission('jobs.view', `/admin/jobs/${id}`);
  const [job, employers] = await Promise.all([getJobById(id), employerOptions()]);
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
