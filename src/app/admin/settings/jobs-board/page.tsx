import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { JobsBoardForm } from '@/components/admin/SettingsForm';
import { getSiteSettings } from '@/lib/cms/data';
import { requirePermission } from '@/lib/rbac/server';

export default async function JobsBoardSettingsPage() {
  await requirePermission('settings.manage', '/admin/settings/jobs-board');
  const settings = await getSiteSettings();

  return (
    <AdminShell current="/admin/settings/jobs-board" isStaff>
      <AdminHeading
        title="Jobs board"
        lead="Search, filter and card labels on /jobs. The vacancy and placement counts are live from the database. Hero wording and photographs stay under CMS › Jobs."
      />
      <SettingsTabs current="/admin/settings/jobs-board" />
      <div className="mt-8 max-w-[760px]">
        <JobsBoardForm initial={settings.jobsBoard} />
      </div>
    </AdminShell>
  );
}
