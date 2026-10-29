import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { ConversionSettingsForm, EmployerLandingForm } from '@/components/admin/SettingsForm';
import { getSiteSettings } from '@/lib/cms/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Conversion & package' };

export default async function ConversionSettingsPage() {
  await requirePermission('settings.manage', '/admin/settings/conversion');
  const settings = await getSiteSettings();
  return (
    <AdminShell current="/admin/settings/conversion" isStaff>
      <AdminHeading
        title="Conversion and package"
        lead="Trust lines, the pricing page, the employer landing page, and the post-assessment offer. The fee and shortlist odds stay under Company & pricing."
      />
      <SettingsTabs current="/admin/settings/conversion" />
      <div className="mt-8 max-w-[760px]">
        <ConversionSettingsForm initial={settings.conversion} />
        <div className="mt-8">
          <EmployerLandingForm initial={settings.employerLanding} />
        </div>
      </div>
    </AdminShell>
  );
}
