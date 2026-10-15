import Link from 'next/link';
import { grants, type Permission } from '@/lib/rbac/permissions';
import { getStaffAccess } from '@/lib/rbac/server';

export const SETTINGS_TABS: { href: string; label: string; permission: Permission }[] = [
  { href: '/admin/settings', label: 'General', permission: 'settings.manage' },
  { href: '/admin/settings/navigation', label: 'Navigation', permission: 'settings.manage' },
  { href: '/admin/settings/seo', label: 'Search & sharing', permission: 'settings.manage' },
  { href: '/admin/settings/applications', label: 'Applications', permission: 'jobs.publish' },
  { href: '/admin/settings/emails', label: 'Emails', permission: 'settings.manage' },
  { href: '/admin/settings/company', label: 'Company & pricing', permission: 'company.manage' },
  { href: '/admin/settings/integrations', label: 'Integrations', permission: 'integrations.manage' },
];

/** The sub-pages of Settings, filtered to the ones this person may open. */
export async function SettingsTabs({ current }: { current: string }) {
  const access = await getStaffAccess();
  const tabs = SETTINGS_TABS.filter((tab) => access && grants(access.permissions, tab.permission));
  return (
    <nav aria-label="Settings sections" className="mt-6 overflow-x-auto border-b border-line">
      <ul className="m-0 flex min-w-max list-none gap-1 p-0">
        {tabs.map((tab) => {
          const active = tab.href === current;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`-mb-px block border-b-2 px-3 py-2.5 text-[14px] no-underline ${active ? 'border-ink font-medium text-ink' : 'border-transparent text-muted hover:text-ink'}`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
