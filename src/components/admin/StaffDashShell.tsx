import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { ProfileMenu } from '@/components/admin/ProfileMenu';
import { ConsoleSearch, type SearchPage, type SearchTarget } from '@/components/admin/ConsoleSearch';
import { whatsappHref } from '@/lib/cms/settings';
import type { Permission } from '@/lib/rbac/permissions';

type Item = { href: string; label: string; permission?: Permission; badge?: number };
type Group = { label: string; icon: string; items: Item[]; pinned?: boolean };

/**
 * Staff / super-admin chrome from the S&A mockup: navy sidebar, gold active
 * state, top search. Groups are already permission-filtered by AdminShell.
 */
export function StaffDashShell({
  current,
  groups,
  displayName,
  email,
  roleLabel,
  avatarUrl,
  unseen = 0,
  searchPages,
  searchTargets,
  menuLinks,
  whatsapp = '',
  children,
}: {
  current: string;
  groups: Group[];
  displayName: string;
  email: string;
  roleLabel: string;
  avatarUrl: string | null;
  unseen?: number;
  searchPages: SearchPage[];
  searchTargets: SearchTarget[];
  menuLinks: { href: string; label: string }[];
  whatsapp?: string;
  children: React.ReactNode;
}) {
  const support = whatsapp ? whatsappHref(whatsapp) : '';
  const initials = (displayName || email)
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

  const navList = (
    <nav aria-label="Console" className="flex flex-1 flex-col gap-1 px-3 py-2">
      {groups.map((group) => {
        const holdsCurrent = group.items.some((item) => navActive(item.href, current));
        return (
          <details key={group.label} open={group.pinned || holdsCurrent} className="group/nav">
            <summary
              className={`t-colors flex cursor-pointer list-none items-center gap-2.5 rounded-[10px] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-white/45 hover:text-white/75 [&::-webkit-details-marker]:hidden ${
                holdsCurrent ? 'text-white/70' : ''
              }`}
            >
              <GroupGlyph path={group.icon} />
              <span className="flex-1 normal-case tracking-normal text-[13px]">{group.label}</span>
              <svg
                viewBox="0 0 24 24"
                className="size-3.5 text-white/40 transition-transform group-open/nav:rotate-90"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <ul className="m-0 mb-1 flex list-none flex-col gap-0.5 ps-1 pe-0 pb-1">
              {group.items.map((item) => {
                const active = navActive(item.href, current);
                return (
                  <li key={`${group.label}:${item.href}`}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`t-colors flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-[14px] no-underline ${
                        active
                          ? 'bg-gradient-to-r from-[#b28a49] to-[#c9a35f] font-semibold text-[#142438]'
                          : 'text-white/80 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge != null && item.badge > 0 ? (
                        <span
                          className={`rounded-full px-1.5 text-[11px] font-semibold ${
                            active ? 'bg-[#142438]/15 text-[#142438]' : 'bg-[#e8c56a] text-[#142438]'
                          }`}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </nav>
  );

  const profileBlock = (
    <div className="flex items-center gap-3 px-5 py-4">
      <span
        aria-hidden
        className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-[#b28a49]/20 text-[14px] font-semibold text-[#e8c56a]"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- staff avatar from storage
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initials
        )}
      </span>
      <div className="min-w-0">
        <p className="m-0 truncate text-[15px] font-medium text-white">{displayName || 'Staff'}</p>
        <p className="m-0 mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-white/55">
          Platform Administrator
          <span className="inline-flex items-center rounded-full bg-[#b28a49]/25 px-2 py-0.5 text-[11px] font-medium text-[#e8c56a]">
            {roleLabel}
          </span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="staff-dash min-h-screen bg-[#f4f2ee] text-ink">
      <details className="group border-b border-[#1e334d] bg-[#142438] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-white [&::-webkit-details-marker]:hidden">
          <Wordmark href="/admin/dashboard" size={22} tone="dark" accent="employer" />
          <span className="rounded-md border border-white/25 px-2.5 py-1 text-[12px] font-medium tracking-wide uppercase">
            Menu
          </span>
        </summary>
        <div className="border-t border-white/10 pb-4">
          {profileBlock}
          <div className="px-3 pb-3">
            <ConsoleSearch pages={searchPages} targets={searchTargets} live />
          </div>
          {navList}
          {support ? <SupportCard href={support} /> : null}
        </div>
      </details>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col overflow-y-auto bg-[#142438] text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Wordmark href="/admin/dashboard" size={26} tone="dark" accent="employer" />
        </div>
        <div className="border-b border-white/10">{profileBlock}</div>
        {navList}
        {support ? (
          <div className="mt-auto border-t border-white/10 p-4">
            <SupportCard href={support} />
          </div>
        ) : (
          <div className="mt-auto" />
        )}
      </aside>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-[#142438]/10 bg-[#142438] text-white">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0 flex-1 [&_input]:rounded-full [&_input]:border-0 [&_input]:bg-white [&_input]:text-[#142438] [&_input]:placeholder:text-[#142438]/45">
              <ConsoleSearch pages={searchPages} targets={searchTargets} live />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/admin/notifications"
                aria-label={unseen > 0 ? `Notifications, ${unseen} new` : 'Notifications'}
                className="t-colors relative grid size-10 place-items-center rounded-full border border-white/25 text-white hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" strokeLinejoin="round" />
                  <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
                </svg>
                {unseen > 0 ? (
                  <span className="absolute -end-1 -top-1 min-w-5 rounded-full bg-[#c44] px-1 text-center font-mono text-[11px] leading-5 text-white">
                    {unseen > 99 ? '99+' : unseen}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/admin/inbox"
                aria-label="CRM inbox"
                className="t-colors grid size-10 place-items-center rounded-full border border-white/25 text-white hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M4 6h16v12H4z" />
                  <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <span className="hidden items-center gap-1.5 rounded-[8px] border border-white/55 px-2.5 py-2 text-[13px] font-medium text-white sm:inline-flex">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18 M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" />
                </svg>
                EN
              </span>
              <ProfileMenu name={displayName} email={email} roleLabel={roleLabel} avatarUrl={avatarUrl} links={menuLinks} />
            </div>
          </div>
        </header>
        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Exact match, or nested under a section. `/admin` alone must not light up every
 * console route that happens to start with that prefix.
 */
function navActive(href: string, current: string): boolean {
  if (href === current) return true;
  if (href === '/admin') return false;
  return current.startsWith(`${href}/`);
}

function SupportCard({ href }: { href: string }) {
  return (
    <div className="mx-3 rounded-[14px] border border-white/10 bg-[#1a2d45] p-3.5 lg:mx-0">
      <p className="m-0 text-[13px] font-medium text-white">Admin Support</p>
      <p className="m-0 mt-1 text-[12px] leading-snug text-white/55">
        WhatsApp the desk if something in the console looks wrong.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-full items-center justify-center rounded-[8px] bg-[#b28a49] px-3 py-2.5 text-[13px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
      >
        Contact Support →
      </a>
    </div>
  );
}

function GroupGlyph({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[16px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
