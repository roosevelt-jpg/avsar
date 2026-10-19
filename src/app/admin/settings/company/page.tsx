import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { CompanyForm } from '@/components/admin/settings/CompanyForm';
import { getSiteSettings } from '@/lib/cms/data';
import { RAIL_CURRENCIES } from '@/lib/company/config';
import { refreshIntegrations } from '@/lib/integrations/runtime';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Company & pricing' };
export const dynamic = 'force-dynamic';

export default async function CompanySettingsPage() {
  await requirePermission('company.manage', '/admin/settings/company');
  await refreshIntegrations();
  const settings = await getSiteSettings();
  const provider = process.env.PAYMENT_PROVIDER ?? '';
  return (
    <AdminShell current="/admin/settings/company" isStaff>
      <AdminHeading
        title="Company & pricing"
        lead="The legal entity, the package price, the shortlist rule and the promises the site makes. Super admins only, and every change is recorded in the audit log with what it was changed to."
      />
      <SettingsTabs current="/admin/settings/company" />
      <div className="mt-8">
        <CompanyForm
          company={settings.company}
          pricing={settings.pricing}
          hiring={settings.hiring}
          cohort={settings.cohort}
          provider={provider}
          railCurrencies={RAIL_CURRENCIES[provider] ?? []}
        />
      </div>
    </AdminShell>
  );
}
