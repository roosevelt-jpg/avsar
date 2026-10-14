import Link from 'next/link';
import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { JobForm } from '@/components/admin/jobs/JobForm';
import { employerOptions } from '@/lib/jobs/admin';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Post a job' };

export default async function NewJob() {
  const access = await requirePermission('jobs.edit', '/admin/jobs/new');
  const employers = await employerOptions();
  return (
    <AdminShell current="/admin/jobs" isStaff>
      <Link href="/admin/jobs" className="font-mono text-[12px] text-muted no-underline hover:text-ink">← All jobs</Link>
      <div className="mt-4">
        <AdminHeading title="Post a job" lead="Fill in what a candidate needs to decide: pay, place, housing and what the employer wants. It saves as a draft first." />
      </div>
      <div className="mt-6">
        <JobForm job={null} employers={employers} canPublish={can(access, 'jobs.publish')} />
      </div>
    </AdminShell>
  );
}
