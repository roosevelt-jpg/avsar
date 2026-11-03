import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { EmployerRegistrationForm } from '@/components/admin/SettingsForm';
import { getSiteSettings } from '@/lib/cms/data';
import { requirePermission } from '@/lib/rbac/server';

export default async function EmployerRegistrationSettingsPage() {
  await requirePermission('settings.manage', '/admin/settings/employer-registration');
  const settings = await getSiteSettings();

  return (
    <AdminShell current="/admin/settings/employer-registration" isStaff>
      <AdminHeading
        title="Employer registration"
        lead="Copy, photographs and form labels on /employers/register. Leave the quote blank until you have a real one — invented testimonials are never shown."
      />
      <SettingsTabs current="/admin/settings/employer-registration" />
      <div className="mt-8 max-w-[760px]">
        <EmployerRegistrationForm initial={settings.employerRegistration} />
      </div>
    </AdminShell>
  );
}
