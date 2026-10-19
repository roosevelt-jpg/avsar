import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { GeneralSettings } from '@/components/admin/SettingsForm';
import { StarterContent } from '@/components/admin/settings/StarterContent';
import { getSiteSettings } from '@/lib/cms/data';
import { DEFAULT_PAGES } from '@/lib/cms/defaults';
import { SETTINGS_KEYS } from '@/lib/cms/settings';
import { can, requirePermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const metadata = { title: 'Settings' };

/** Which settings sections and pages have never been saved to the database. */
async function unsaved() {
  const admin = getAdminSupabase();
  if (!admin) return { settings: [], pages: [] };
  const [settings, pages] = await Promise.all([
    admin.from('site_settings').select('key'),
    admin.from('cms_pages').select('slug').eq('locale', 'en'),
  ]);
  const storedKeys = new Set((settings.data ?? []).map((row) => String(row.key)));
  const storedPages = new Set((pages.data ?? []).map((row) => String(row.slug)));
  return {
    settings: SETTINGS_KEYS.filter((key) => !storedKeys.has(key)),
    pages: DEFAULT_PAGES.map((page) => page.slug).filter((slug) => !storedPages.has(slug)),
  };
}

export default async function SettingsPage() {
  const access = await requirePermission('settings.manage', '/admin/settings');
  const [settings, missing] = await Promise.all([getSiteSettings(), can(access, 'company.manage') ? unsaved() : { settings: [], pages: [] }]);
  return (
    <AdminShell current="/admin/settings" isStaff>
      <AdminHeading
        title="Settings"
        lead="Contact details, the announcement bar and the footer. Everything here is public: never put a password or key in these fields; keys belong on the Integrations page."
      />
      <SettingsTabs current="/admin/settings" />
      <div className="mt-8 flex flex-col gap-5">
        <StarterContent missingSettings={missing.settings} missingPages={missing.pages} />
        <GeneralSettings initial={settings} />
      </div>
    </AdminShell>
  );
}
