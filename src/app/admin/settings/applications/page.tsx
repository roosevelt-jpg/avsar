import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { ApplicationSettings } from '@/components/admin/SettingsForm';
import { getSiteSettings } from '@/lib/cms/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Application rules' };

export default async function ApplicationSettingsPage() {
  await requirePermission('jobs.publish', '/admin/settings/applications');
  const settings = await getSiteSettings();
  return (
    <AdminShell current="/admin/settings/applications" isStaff>
      <AdminHeading title="Application rules" lead="Who can apply to a job, and how." />
      <SettingsTabs current="/admin/settings/applications" />
      <div className="mt-8 max-w-[760px]">
        <ApplicationSettings initial={settings.applications} />
      </div>
    </AdminShell>
  );
}
