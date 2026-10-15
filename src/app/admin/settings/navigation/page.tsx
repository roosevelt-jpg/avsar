import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { NavigationSettings } from '@/components/admin/SettingsForm';
import { getSiteSettings } from '@/lib/cms/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Navigation' };

export default async function NavigationSettingsPage() {
  await requirePermission('settings.manage', '/admin/settings/navigation');
  const settings = await getSiteSettings();
  return (
    <AdminShell current="/admin/settings/navigation" isStaff>
      <AdminHeading title="Navigation" lead="The links in the public site’s header and footer." />
      <SettingsTabs current="/admin/settings/navigation" />
      <div className="mt-8">
        <NavigationSettings initial={settings.navigation} />
      </div>
    </AdminShell>
  );
}
