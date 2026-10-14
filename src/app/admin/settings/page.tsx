import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { getSiteSettings } from '@/lib/cms/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Site settings' };

export default async function SettingsPage() {
  await requirePermission('settings.manage', '/admin/settings');
  const settings = await getSiteSettings();
  return (
    <AdminShell current="/admin/settings" isStaff>
      <AdminHeading
        title="Site settings"
        lead="Contact details, navigation, the announcement bar and application rules. Everything here is public: never put a password or key in these fields."
      />
      <div className="mt-8">
        <SettingsForm initial={settings} />
      </div>
    </AdminShell>
  );
}
