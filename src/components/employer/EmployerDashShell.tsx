import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { ProfileMenu } from '@/components/admin/ProfileMenu';
import { ConsoleSearch, type SearchPage, type SearchTarget } from '@/components/admin/ConsoleSearch';
import { whatsappHref } from '@/lib/cms/settings';

export type EmployerNavKey =
  | 'dashboard'
  | 'post'
  | 'jobs'
  | 'candidates'
  | 'applications'
  | 'interviews'
  | 'hires'
  | 'relocation'
  | 'shortlists'
  | 'company';

/**
 * Employer portal chrome from the Lusitana Hotels mockup: navy sidebar, gold
 * active state, top search. Links only to routes employers already have;
 * Billing is omitted because there is no employer self-serve billing page.
 */
export async function EmployerDashShell({
  current,
  companyName,
  verified,
  initials,
  avatarUrl,
  email,
  applicantBadge = 0,
  whatsapp = '',
  children,
}: {
  current: string;
  companyName: string;
  verified: boolean;
  initials: string;
  avatarUrl: string | null;
  email: string;
  applicantBadge?: number;
  whatsapp?: string;
  children: React.ReactNode;
}) {
  const support = whatsapp ? whatsappHref(whatsapp) : '';

  const items: { key: EmployerNavKey; href: string; label: string; match: string[]; badge?: number }[] = [
    { key: 'dashboard', href: '/admin/employer', label: 'Dashboard', match: ['/admin/employer'] },
    { key: 'post', href: '/admin/vacancies#request', label: 'Post a Job', match: [] },
    { key: 'jobs', href: '/admin/vacancies', label: 'Manage Jobs', match: ['/admin/vacancies'] },
    { key: 'candidates', href: '/admin/employer#talent-search', label: 'Candidates', match: [] },
    {
      key: 'applications',
      href: '/admin/applicants',
      label: 'Applications',
      match: ['/admin/applicants'],
      badge: applicantBadge > 0 ? applicantBadge : undefined,
    },
    { key: 'interviews', href: '/admin/applicants#interviews', label: 'Interviews', match: [] },
    { key: 'hires', href: '/admin/placements', label: 'Hires & Onboarding', match: ['/admin/placements'] },
    { key: 'relocation', href: '/admin/bench', label: 'Relocation Support', match: ['/admin/bench'] },
    { key: 'shortlists', href: '/admin/shortlists', label: 'Shortlists', match: ['/admin/shortlists'] },
    { key: 'company', href: '/admin/vacancies#company', label: 'Company Profile', match: [] },
  ];

  const searchPages: SearchPage[] = items
    .filter((item) => item.match.length > 0)
    .map((item) => ({ href: item.href.split('#')[0]!, label: item.label, group: 'Employer' }));
  const searchTargets: SearchTarget[] = [{ label: 'Search talent', base: '/admin/employer?q=' }];

  const isActive = (item: (typeof items)[number]) =>
    item.match.some((href) => current === href || current.startsWith(`${href}/`));

  const navList = (
    <nav aria-label="Employer" className="flex flex-1 flex-col gap-0.5 px-3 py-2">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`t-colors flex items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-[14px] no-underline ${
              active
                ? 'bg-gradient-to-r from-[#b28a49] to-[#c9a35f] font-semibold text-[#142438]'
                : 'text-white/80 hover:bg-white/8 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <EmpIcon name={item.key} />
              {item.label}
            </span>
            {item.badge != null ? (
              <span className="rounded-full bg-[#e8c56a] px-1.5 text-[11px] font-semibold text-[#142438]">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const companyBlock = (
    <div className="flex items-center gap-3 px-5 py-4">
      <span
        aria-hidden
        className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-[#b28a49]/20 text-[14px] font-semibold text-[#e8c56a]"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- employer logo path from storage; size unknown
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initials || '?'
        )}
      </span>
      <div className="min-w-0">
        <p className="m-0 truncate text-[15px] font-medium text-white">{companyName}</p>
        <p className="m-0 mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-white/55">
          Employer
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#2f7d4a]/25 px-2 py-0.5 text-[11px] font-medium text-[#7dcea0]">
              ✓ Verified Employer
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );

  return (
    <div className="employer-dash min-h-screen bg-[#f4f2ee] text-ink">
      <details className="group border-b border-[#1e334d] bg-[#142438] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-white [&::-webkit-details-marker]:hidden">
          <Wordmark href="/admin/employer" size={22} tone="dark" accent="employer" />
          <span className="rounded-md border border-white/25 px-2.5 py-1 text-[12px] font-medium tracking-wide uppercase">
            Menu
          </span>
        </summary>
        <div className="border-t border-white/10 pb-4">
          {companyBlock}
          {navList}
          {support ? <SupportCard href={support} /> : null}
        </div>
      </details>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col bg-[#142438] text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Wordmark href="/admin/employer" size={26} tone="dark" accent="employer" />
        </div>
        <div className="border-b border-white/10">{companyBlock}</div>
        {navList}
        {support ? (
          <div className="mt-auto border-t border-white/10 p-4">
            <SupportCard href={support} />
          </div>
        ) : (
          <div className="mt-auto" />
        )}
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 border-b border-[#142438]/10 bg-[#142438] text-white">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0 flex-1 [&_input]:rounded-full [&_input]:border-0 [&_input]:bg-white [&_input]:text-[#142438] [&_input]:placeholder:text-[#142438]/45">
              <ConsoleSearch pages={searchPages} targets={searchTargets} live={false} />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-[8px] border border-white/55 px-2.5 py-2 text-[13px] font-medium text-white sm:inline-flex">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18 M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" />
                </svg>
                EN
              </span>
              <ProfileMenu
                name={companyName}
                email={email}
                roleLabel="Employer"
                avatarUrl={avatarUrl}
                links={[{ href: '/admin/vacancies#company', label: 'Company profile' }]}
              />
            </div>
          </div>
        </header>
        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}

function SupportCard({ href }: { href: string }) {
  return (
    <div className="mx-3 rounded-[14px] border border-white/10 bg-[#1a2d45] p-3.5 lg:mx-0">
      <p className="m-0 text-[13px] font-medium text-white">Employer Support</p>
      <p className="m-0 mt-1 text-[12px] leading-snug text-white/55">
        Questions on a vacancy, interview or hire — WhatsApp our desk.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-full items-center justify-center rounded-[8px] bg-[#b28a49] px-3 py-2.5 text-[13px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
      >
        Contact Our Team →
      </a>
    </div>
  );
}

function EmpIcon({ name }: { name: EmployerNavKey }) {
  const c = 'size-[18px] shrink-0';
  const props = { viewBox: '0 0 24 24', className: c, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true as const };
  switch (name) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'post':
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      );
    case 'jobs':
      return (
        <svg {...props}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case 'candidates':
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2 20c.9-3.2 3.4-5 7-5s6.1 1.8 7 5" strokeLinecap="round" />
          <circle cx="17" cy="9" r="2.5" />
        </svg>
      );
    case 'applications':
      return (
        <svg {...props}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
        </svg>
      );
    case 'interviews':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
      );
    case 'hires':
      return (
        <svg {...props}>
          <path d="M7 11l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" strokeLinecap="round" />
        </svg>
      );
    case 'relocation':
      return (
        <svg {...props}>
          <path d="M3 21h18M5 21V10l7-6 7 6v11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case 'shortlists':
      return (
        <svg {...props}>
          <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18l.9-5.4L4.2 8.7l5.4-.8L12 3z" strokeLinejoin="round" />
        </svg>
      );
    case 'company':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
