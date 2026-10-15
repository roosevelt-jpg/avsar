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
        lead="What Google shows, and the card WhatsApp, Facebook and LinkedIn show when a link is shared. Pages, jobs and legal pages have their own fields in their editors; these are the site defaults and the pages built in code."
      />
      <SettingsTabs current="/admin/settings/seo" />
      <div className="mt-8">
        <SeoForm initial={settings.seo} />
      </div>
    </AdminShell>
  );
}
