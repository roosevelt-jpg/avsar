import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { SettingsTabs } from '@/components/admin/SettingsTabs';
import { IntegrationCard, type FieldStatus } from '@/components/admin/IntegrationsForm';
import { ENVIRONMENT_ONLY, INTEGRATIONS } from '@/lib/integrations/catalog';
import { canEncrypt } from '@/lib/integrations/crypto';
import { integrationSource, refreshIntegrations } from '@/lib/integrations/runtime';
import { requirePermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const metadata = { title: 'Integrations' };
export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  await requirePermission('integrations.manage', '/admin/settings/integrations');
  await refreshIntegrations(true);

  const admin = getAdminSupabase();
  const { data } = admin ? await admin.from('integration_secrets').select('name, hint') : { data: null };
  const hints = new Map((data ?? []).map((row) => [String(row.name), String(row.hint ?? '')]));
  const saved = new Set(hints.keys());

  /* Secret values never leave the server. Plain settings such as the site
     address are sent so they can be edited in place. */
  const status: Record<string, FieldStatus> = {};
  for (const group of INTEGRATIONS) {
    for (const item of group.items) {
      for (const field of item.fields) {
        status[field.name] = {
          source: integrationSource(field.name, saved),
          hint: hints.get(field.name) ?? '',
          value: field.secret ? '' : (process.env[field.name] ?? ''),
        };
      }
    }
  }

  return (
    <AdminShell current="/admin/settings/integrations" isStaff>
      <AdminHeading
        title="Integrations"
        lead="Keys and settings for every outside service. Keys are encrypted before they are stored and are never shown again, only their last four characters. A value saved here replaces the one in the hosting environment; removing it brings that one back."
      />
      <SettingsTabs current="/admin/settings/integrations" />

      {!canEncrypt() && (
        <p role="alert" className="m-0 mt-6 rounded-[14px] border border-accent bg-accent-tint p-4 text-[14px] leading-[1.5]">
          Keys cannot be saved yet: set <code>INTEGRATIONS_MASTER_KEY</code> (at least 32 random characters) in the hosting
          environment and redeploy. Until then, keys can only come from the hosting environment.
        </p>
      )}

      {INTEGRATIONS.map((group) => (
        <section key={group.group} className="mt-8">
          <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{group.group}</h2>
          <div className="mt-3 grid gap-4 xl:grid-cols-2">
            {group.items.map((item) => (
              <IntegrationCard key={item.id} integration={item} status={status} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Hosting environment only</h2>
        <p className="m-0 mt-1 max-w-[70ch] text-[13px] leading-[1.5] text-ink-2">
          These are needed before the console can reach the database, or are built into the pages sent to browsers, so
          they are set in Vercel and cannot be changed here.
        </p>
        <ul className="m-0 mt-3 grid list-none gap-2 p-0 sm:grid-cols-2">
          {ENVIRONMENT_ONLY.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-3 rounded-[12px] border border-line bg-surface px-4 py-3 text-[13px]">
              <span>
                {item.label}
                <span className="block font-mono text-[11px] text-muted">{item.name}</span>
              </span>
              <span className={`font-mono text-[11px] ${process.env[item.name] ? 'text-success' : 'text-muted'}`}>
                {process.env[item.name] ? 'Set' : 'Not set'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
