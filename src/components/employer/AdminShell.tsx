import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { getStaffAccess } from '@/lib/rbac/server';
import { unseenCount } from '@/lib/notifications/staff';
import { grants, roleName, type Permission } from '@/lib/rbac/permissions';

/**
 * The frame every staff and employer screen sits in.
 *
 * The navigation is filtered by permission, so a content editor sees Pages
 * and Media and nothing else, and a link is never shown to a page that would
 * refuse the person clicking it. Employers get their own short list.
 *
 * One definition still means a link and the page behind it are added together
 * or not at all; that is why this file exists.
 */

type Item = { href: string; label: string; permission?: Permission };
type Group = { label: string; items: Item[] };

const STAFF_NAV: Group[] = [
  { label: 'Overview', items: [{ href: '/admin/dashboard', label: 'Dashboard', permission: 'dashboard.view' }] },
  {
    label: 'Recruitment',
    items: [
      { href: '/admin/jobs', label: 'Jobs', permission: 'jobs.view' },
      { href: '/admin/applications', label: 'Applications', permission: 'applications.view' },
      { href: '/admin/inbox', label: 'Inbox', permission: 'leads.manage' },
      { href: '/admin', label: 'Talent search', permission: 'candidates.view' },
      { href: '/admin/shortlists', label: 'Shortlists', permission: 'candidates.view' },
      { href: '/admin/cvs', label: 'CV queue', permission: 'cv.review' },
      { href: '/admin/cohorts', label: 'Cohorts', permission: 'candidates.view' },
      { href: '/admin/relocation', label: 'Relocation', permission: 'relocation.manage' },
    ],
  },
  {
    label: 'Employers',
    items: [
      { href: '/admin/employers', label: 'Employers', permission: 'employers.manage' },
      { href: '/admin/placements', label: 'Placements', permission: 'placements.manage' },
      { href: '/admin/unlocks', label: 'Profile requests', permission: 'relocation.manage' },
    ],
  },
  {
    label: 'Website',
    items: [
      { href: '/admin/cms', label: 'Pages', permission: 'cms.view' },
      { href: '/admin/cms/media', label: 'Media library', permission: 'media.manage' },
      { href: '/admin/settings', label: 'Site settings', permission: 'settings.manage' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/payments', label: 'Payments', permission: 'payments.view' },
      { href: '/admin/fees', label: 'Employer fees', permission: 'payments.view' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/admin/staff', label: 'Staff', permission: 'staff.manage' },
      { href: '/admin/roles', label: 'Roles & permissions', permission: 'roles.manage' },
      { href: '/admin/audit', label: 'Audit log', permission: 'audit.view' },
      { href: '/admin/privacy', label: 'Privacy', permission: 'privacy.manage' },
      { href: '/admin/security', label: 'Sign-in security' },
    ],
  },
];

const EMPLOYER_NAV: Group[] = [
  {
    label: 'Hiring',
    items: [
      { href: '/admin/vacancies', label: 'Vacancies' },
      { href: '/admin/applicants', label: 'Applicants' },
      { href: '/admin/bench', label: 'Ready to travel' },
      { href: '/admin', label: 'Search talent' },
      { href: '/admin/shortlists', label: 'Shortlists' },
      { href: '/admin/placements', label: 'Placements' },
    ],
  },
];

function NavList({ groups, current }: { groups: Group[]; current: string }) {
  return (
    <nav aria-label="Console" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="m-0 mb-2 px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{group.label}</p>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {group.items.map((item) => {
              const active = item.href === current;
              return (
                <li key={item.href}>
                  {active ? (
                    <span aria-current="page" className="block rounded-[10px] bg-ink px-3 py-2 text-[14px] font-medium text-paper">
                      {item.label}
                    </span>
                  ) : (
                    <Link href={item.href} className="t-colors block rounded-[10px] px-3 py-2 text-[14px] text-ink-2 no-underline hover:bg-surface hover:text-ink">
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export async function AdminShell({
  current,
  isStaff,
  suffix,
  children,
}: {
  /** The href of the page being rendered, so it is marked rather than linked. */
  current: string;
  isStaff: boolean;
  suffix?: string;
  children: React.ReactNode;
}) {
  const access = isStaff ? await getStaffAccess() : null;
  const unseen = access ? await unseenCount(access.userId) : 0;
  const groups = isStaff
    ? STAFF_NAV.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.permission || (access && grants(access.permissions, item.permission))),
      })).filter((group) => group.items.length > 0)
    : EMPLOYER_NAV;

  return (
    <div className="avsar-root min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-e border-line bg-paper lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
        <div className="px-5 pt-5 pb-6">
          <Wordmark href={isStaff ? '/admin/dashboard' : '/admin'} suffix={suffix ?? (isStaff ? 'console' : 'talent pool')} accent="employer" size={22} />
        </div>
        <div className="flex-1 px-2 pb-6">
          <NavList groups={groups} current={current} />
        </div>
        {access && (
          <div className="border-t border-line px-5 py-4">
            <p className="m-0 truncate text-[13px] text-ink">{access.email}</p>
            <p className="m-0 font-mono text-[11px] text-muted">
              {roleName(access.role)}
              {access.demo ? ' · demo mode' : ''}
            </p>
          </div>
        )}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-paper/90 px-[clamp(20px,3cqi,40px)] py-3 backdrop-blur">
          <div className="flex items-center gap-3 lg:hidden">
            <details className="relative">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-line-strong bg-surface [&::-webkit-details-marker]:hidden" aria-label="Menu">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              </summary>
              <div className="absolute start-0 top-12 z-40 max-h-[80vh] w-[280px] overflow-y-auto rounded-[18px] border border-line bg-paper p-3 shadow-[0_24px_60px_-24px_rgba(27,26,23,0.4)]">
                <NavList groups={groups} current={current} />
              </div>
            </details>
            <Wordmark href={isStaff ? '/admin/dashboard' : '/admin'} accent="employer" size={20} />
          </div>
          <div className="hidden lg:block">
            {access?.demo && (
              <span className="rounded-full bg-accent-tint px-3 py-1 font-mono text-[11px] text-accent-deep">
                Demo mode: Supabase is not configured, so nothing is saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {access && (
              <Link
                href="/admin/notifications"
                aria-label={unseen > 0 ? `Notifications, ${unseen} new` : 'Notifications'}
                className="t-colors relative grid size-10 place-items-center rounded-full border border-line-strong bg-surface text-ink hover:border-ink"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" strokeLinejoin="round" />
                  <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
                </svg>
                {unseen > 0 && (
                  <span className="absolute -end-1 -top-1 min-w-5 rounded-full bg-accent px-1 text-center font-mono text-[11px] leading-5 text-white">
                    {unseen > 99 ? '99+' : unseen}
                  </span>
                )}
              </Link>
            )}
            <AccountMenu locale="en" tone="employer" />
          </div>
        </header>

        <main className="px-[clamp(20px,3cqi,40px)] py-[clamp(24px,3cqi,40px)]">{children}</main>
      </div>
    </div>
  );
}

/** The heading block the inner pages share. */
export function AdminHeading({ title, lead, actions }: { title: string; lead?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="m-0 text-[clamp(24px,3cqi,32px)] font-semibold leading-[1.1] tracking-[-0.03em]">{title}</h1>
        {lead && <p className="mt-2 mb-0 max-w-[72ch] text-[15px] leading-[1.6] text-ink-2">{lead}</p>}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** What a list says when it is empty, instead of an empty table. */
export function AdminEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-7 mb-0 rounded-[12px] border border-line bg-surface-subtle px-5 py-4 text-[14px] leading-[1.6] text-muted">
      {children}
    </p>
  );
}

export { Pill } from '@/components/admin/Pill';

/** Primary/secondary link buttons for headings. */
export function AdminButton({ href, children, variant = 'dark' }: { href: string; children: React.ReactNode; variant?: 'dark' | 'light' }) {
  return (
    <Link
      href={href}
      className={`t-colors inline-flex items-center rounded-full px-4 py-2 text-[14px] font-medium no-underline ${
        variant === 'dark' ? 'bg-ink text-paper hover:bg-employer-deep' : 'border border-line-strong bg-surface text-ink hover:border-ink'
      }`}
    >
      {children}
    </Link>
  );
}
