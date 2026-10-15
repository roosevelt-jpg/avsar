import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { EmailsForm } from '@/components/admin/settings/EmailsForm';
import { getSiteSettings } from '@/lib/cms/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Emails' };

export default async function EmailSettingsPage() {
  await requirePermission('settings.manage', '/admin/settings/emails');
  const settings = await getSiteSettings();
  const common = {
    site_name: settings.general.siteName,
    support_email: settings.general.supportEmail,
    support_phone: settings.general.supportPhone,
  };
  return (
    <AdminShell current="/admin/settings/emails" isStaff>
      <AdminHeading
        title="Emails"
        lead="The words of every email the platform sends. Plain text with placeholders; the layout, logo and company footer are added automatically. Hindi versions of the confirmation and reminder emails are translations kept with the rest of the interface wording."
      />
      <SettingsTabs current="/admin/settings/emails" />
      <div className="mt-8">
        <EmailsForm initial={settings.emails} common={common} />
      </div>
    </AdminShell>
  );
}
