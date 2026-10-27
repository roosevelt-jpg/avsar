import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { HeaderClock } from '@/components/admin/HeaderClock';
import { ProfileMenu } from '@/components/admin/ProfileMenu';
import { ConsoleSearch, type SearchPage, type SearchTarget } from '@/components/admin/ConsoleSearch';
import { getViewer } from '@/lib/auth';
import { can, getStaffAccess } from '@/lib/rbac/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { unseenCount } from '@/lib/notifications/staff';
import { grants, roleName, type Permission } from '@/lib/rbac/permissions';
import { SETTINGS_TABS } from '@/components/admin/SettingsTabs';

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
type Group = { label: string; icon: keyof typeof ICONS; items: Item[]; pinned?: boolean };

/* Outline icons, one per group, so each section is recognisable at a glance
   even when it is collapsed. */
const ICONS = {
  overview: 'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z',
  hiring: 'M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1m-11 0h16a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Zm-1 6h18',
  candidates: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5M16 3.5a4 4 0 0 1 0 7.5M18.5 14.5c1.9.8 3.1 2.6 3.5 5.5',
  relocation: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  employers: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01M9 13.5h.01M15 13.5h.01',
  crm: 'M4 5h16v11H9l-5 4V5Zm4 5h8M8 13h5',
  finance: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 3h18M7 15h3',
  website: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z',
  settings: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4',
  admin: 'M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Zm-3 9 2 2 4-4',
} as const;

const STAFF_NAV: Group[] = [
  {
    label: 'Overview',
    icon: 'overview',
    pinned: true,
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', permission: 'dashboard.view' },
      { href: '/admin/analysis', label: 'Insights', permission: 'dashboard.view' },
      { href: '/admin/notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'Hiring',
    icon: 'hiring',
    items: [
      { href: '/admin/jobs', label: 'Jobs', permission: 'jobs.view' },
      { href: '/admin/applications', label: 'Applications', permission: 'applications.view' },
      { href: '/admin/placements', label: 'Placements', permission: 'placements.manage' },
      { href: '/admin/cohorts', label: 'Cohorts', permission: 'candidates.view' },
    ],
  },
  {
    label: 'Candidates',
    icon: 'candidates',
    items: [
      { href: '/admin', label: 'Talent search', permission: 'candidates.view' },
      { href: '/admin/shortlists', label: 'Shortlists', permission: 'candidates.view' },
      { href: '/admin/cv-queue', label: 'CV queue', permission: 'cv.review' },
      { href: '/admin/items', label: 'Assessment items', permission: 'cv.review' },
    ],
  },
  {
    label: 'Relocation & legal',
    icon: 'relocation',
    items: [
      { href: '/admin/legal-reviews', label: 'Legal reviews', permission: 'relocation.manage' },
      { href: '/admin/relocation', label: 'Relocation', permission: 'relocation.manage' },
      { href: '/admin/unlocks', label: 'Profile requests', permission: 'relocation.manage' },
    ],
  },
  {
    label: 'CRM',
    icon: 'crm',
    items: [
      { href: '/admin/inbox', label: 'Leads & messages', permission: 'leads.manage' },
      { href: '/admin/subscribers', label: 'Email subscribers', permission: 'leads.manage' },
      { href: '/admin/employers', label: 'Employers', permission: 'employers.manage' },
    ],
  },
  {
    label: 'Finance',
    icon: 'finance',
    items: [
      { href: '/admin/payments', label: 'Payments', permission: 'payments.view' },
      { href: '/admin/fees', label: 'Employer fees', permission: 'payments.view' },
    ],
  },
  {
    label: 'Website',
    icon: 'website',
    items: [
      { href: '/admin/cms', label: 'Pages', permission: 'cms.view' },
      { href: '/admin/assistant', label: 'Assistant brain', permission: 'cms.edit' },
      { href: '/admin/cms/media', label: 'Media library', permission: 'media.manage' },
    ],
  },
  { label: 'Settings', icon: 'settings', items: SETTINGS_TABS },
  {
    label: 'Administration',
    icon: 'admin',
    items: [
      { href: '/admin/staff', label: 'Staff', permission: 'staff.manage' },
      { href: '/admin/roles', label: 'Roles & permissions', permission: 'roles.manage' },
      { href: '/admin/audit', label: 'Audit log', permission: 'audit.view' },
      { href: '/admin/privacy', label: 'Privacy requests', permission: 'privacy.manage' },
      { href: '/admin/security', label: 'Sign-in security' },
    ],
  },
];

const EMPLOYER_NAV: Group[] = [
  {
    label: 'Hiring',
    icon: 'hiring',
    pinned: true,
    items: [
      { href: '/admin/vacancies', label: 'Vacancies' },
      { href: '/admin/applicants', label: 'Applicants' },
      { href: '/admin/placements', label: 'Placements' },
    ],
  },
  {
    label: 'Talent',
    icon: 'candidates',
    pinned: true,
    items: [
      { href: '/admin/employer', label: 'Search talent' },
      { href: '/admin/shortlists', label: 'Shortlists' },
      { href: '/admin/bench', label: 'Ready to travel' },
    ],
  },
];

function GroupIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <path d={ICONS[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Each group is a native <details>: collapsible without JavaScript, open when
 * it holds the current page, and always open for the pinned overview. The
 * items hang off a rule so it is clear which heading they belong to.
 */
function NavList({ groups, current }: { groups: Group[]; current: string }) {
  return (
    <nav aria-label="Console" className="flex flex-col gap-1">
      {groups.map((group) => {
        const holdsCurrent = group.items.some((item) => item.href === current);
        return (
          <details key={group.label} open={group.pinned || holdsCurrent} className="group/nav rounded-[12px]">
            <summary
              className={`t-colors flex cursor-pointer list-none items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-[13px] font-semibold hover:bg-console [&::-webkit-details-marker]:hidden ${
                holdsCurrent ? 'text-ink' : 'text-ink-2'
              }`}
            >
              <GroupIcon name={group.icon} />
              <span className="flex-1">{group.label}</span>
              <span className="font-mono text-[11px] font-normal text-muted">{group.items.length}</span>
              <svg viewBox="0 0 24 24" className="size-3.5 text-muted transition-transform group-open/nav:rotate-90" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <ul className="m-0 ms-[22px] mb-2 flex list-none flex-col gap-0.5 border-s border-line py-0.5 ps-2.5 pe-1">
              {group.items.map((item) => {
                const active = item.href === current;
                return (
                  <li key={item.href}>
                    {active ? (
                      <span aria-current="page" className="relative block rounded-[9px] bg-console px-3 py-1.5 text-[14px] font-semibold text-ink before:absolute before:inset-y-1.5 before:-start-[11px] before:w-[2px] before:rounded-full before:bg-ink">
                        {item.label}
                      </span>
                    ) : (
                      <Link href={item.href} className="t-colors block rounded-[9px] px-3 py-1.5 text-[14px] text-ink-2 no-underline hover:bg-console hover:text-ink">
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
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

  /* The profile image and display name live in the auth user's metadata, so
     they need no extra table and work the same for staff and employers. */
  const supabase = await getServerSupabase();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const meta = (auth.user?.user_metadata ?? {}) as Record<string, unknown>;
  const viewer = isStaff ? null : await getViewer();
  const email = access?.email ?? auth.user?.email ?? '';
  const displayName = typeof meta.full_name === 'string' ? meta.full_name : viewer?.role === 'employer' ? viewer.employer.name : '';
  const avatarUrl = typeof meta.avatar_url === 'string' ? meta.avatar_url : null;
  const roleLabel = access ? roleName(access.role) : 'Employer';
  const menuLinks = [
    ...(access && can(access, 'settings.manage') ? [{ href: '/admin/settings', label: 'Settings' }] : []),
    ...(access ? [{ href: '/admin/security', label: 'Sign-in security' }] : []),
  ];

  /* The search box gets the same permission-filtered pages as the sidebar,
     plus the free-text searches this person may run. */
  const searchPages: SearchPage[] = groups.flatMap((group) => group.items.map((item) => ({ href: item.href, label: item.label, group: group.label })));
  const searchTargets: SearchTarget[] = [
    ...(!access || can(access, 'candidates.view')
      ? [{ label: 'Search talent', base: isStaff ? '/admin?q=' : '/admin/employer?q=' }]
      : !isStaff
        ? [{ label: 'Search talent', base: '/admin/employer?q=' }]
        : []),
    ...(access && can(access, 'applications.view') ? [{ label: 'Search applications', base: '/admin/applications?q=' }] : []),
  ];

  return (
    <div className="avsar-root console-atmosphere min-h-screen max-w-[100vw] overflow-x-clip lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="hidden border-e border-line/80 bg-surface/95 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto backdrop-blur-sm">
        <div className="px-5 pt-5 pb-5">
          <Wordmark
            href={isStaff ? '/admin/dashboard' : '/admin/employer'}
            suffix={suffix ?? (isStaff ? 'console' : 'talent pool')}
            accent="employer"
            size={22}
          />
        </div>
        <div className="flex-1 px-2.5 pb-6">
          <NavList groups={groups} current={current} />
        </div>
      </aside>

      <div className="min-w-0 max-w-full">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line/80 bg-surface/90 px-[clamp(12px,3cqi,40px)] py-3 backdrop-blur-md sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:hidden">
            <details className="relative">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-line-strong bg-surface [&::-webkit-details-marker]:hidden" aria-label="Menu">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              </summary>
              <div className="absolute start-0 top-12 z-40 max-h-[80vh] w-[min(88vw,300px)] overflow-y-auto rounded-[18px] border border-line bg-paper p-3 shadow-[0_24px_60px_-24px_rgba(27,26,23,0.4)]">
                <div className="mb-3 md:hidden">
                  <ConsoleSearch pages={searchPages} targets={searchTargets} live={Boolean(access)} />
                </div>
                <NavList groups={groups} current={current} />
              </div>
            </details>
            <Wordmark href={isStaff ? '/admin/dashboard' : '/admin/employer'} accent="employer" size={18} />
          </div>
          <div className="hidden min-w-0 flex-1 md:block">
            <ConsoleSearch pages={searchPages} targets={searchTargets} live={Boolean(access)} />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden pe-2 xl:block">
              <HeaderClock />
            </div>
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
            <ProfileMenu name={displayName} email={email} roleLabel={roleLabel} avatarUrl={avatarUrl} links={menuLinks} />
          </div>
        </header>

        <main className="min-w-0 px-[clamp(12px,3cqi,40px)] py-[clamp(20px,3cqi,40px)]">{children}</main>
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
        variant === 'dark' ? 'bg-ink text-paper hover:bg-ink-hover' : 'border border-line-strong bg-surface text-ink hover:border-ink'
      }`}
    >
      {children}
    </Link>
  );
}
