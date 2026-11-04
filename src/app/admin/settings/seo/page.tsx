import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { SeoForm } from '@/components/admin/settings/SeoForm';
import { getSiteSettings } from '@/lib/cms/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Search & sharing' };

export default async function SeoSettingsPage() {
  await requirePermission('settings.manage', '/admin/settings/seo');
  const settings = await getSiteSettings();
  return (
    <AdminShell current="/admin/settings/seo" isStaff>
      <AdminHeading
        title="Search & sharing"
        lead="Edit the WhatsApp / social share card (title, description, image) here. The homepage can also override those fields in CMS › Pages › Home. Other CMS pages and jobs keep their own fields in their editors."
      />
      <SettingsTabs current="/admin/settings/seo" />
      <div className="mt-8">
        <SeoForm initial={settings.seo} />
      </div>
    </AdminShell>
  );
}
