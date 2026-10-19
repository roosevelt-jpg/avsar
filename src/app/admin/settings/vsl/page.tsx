import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { VslSettingsForm } from '@/components/admin/SettingsForm';
import { getSiteSettings } from '@/lib/cms/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'VSL funnel' };

export default async function VslSettingsPage() {
  await requirePermission('settings.manage', '/admin/settings/vsl');
  const settings = await getSiteSettings();
  return (
    <AdminShell current="/admin/settings/vsl" isStaff>
      <AdminHeading
        title="VSL funnel"
        lead="Paid-traffic landing at /en/go (and every locale). No site nav or footer. Video and copy edit here; the primary button always opens sign-up."
      />
      <SettingsTabs current="/admin/settings/vsl" />
      <div className="mt-8 max-w-[760px]">
        <VslSettingsForm initial={settings.vsl} />
      </div>
    </AdminShell>
  );
}
