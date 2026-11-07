import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { ProfileMenu } from '@/components/admin/ProfileMenu';
import { ConsoleSearch, type SearchPage, type SearchTarget } from '@/components/admin/ConsoleSearch';
import { whatsappHref } from '@/lib/cms/settings';

export type EmployerNavKey =
  | 'dashboard'
  | 'jobs'
  | 'applications'
  | 'interviews'
  | 'company'
  | 'billing'
  | 'post'
  | 'candidates'
  | 'hires'
  | 'relocation'
  | 'shortlists';

/**
 * Employer portal chrome aligned to the HTML-44 pack hiring workspace.
 */
export async function EmployerDashShell({
  current,
  companyName,
  verified,
  initials: _initials,
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
  void _initials;
  const support = whatsapp ? whatsappHref(whatsapp) : '';

  const items: { key: EmployerNavKey; href: string; label: string; match: string[]; badge?: number }[] = [
    { key: 'dashboard', href: '/admin/employer', label: 'Dashboard', match: ['/admin/employer'] },
    { key: 'jobs', href: '/admin/vacancies', label: 'Post & Manage Jobs', match: ['/admin/vacancies'] },
    {
      key: 'applications',
      href: '/admin/applicants',
      label: 'Applicants',
      match: ['/admin/applicants'],
      badge: applicantBadge > 0 ? applicantBadge : undefined,
    },
    { key: 'interviews', href: '/admin/interviews', label: 'Interviews', match: ['/admin/interviews'] },
    { key: 'company', href: '/admin/vacancies#company', label: 'Company Profile', match: [] },
    { key: 'billing', href: '/admin/billing', label: 'Billing & Plans', match: ['/admin/billing'] },
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
            className={`t-colors flex items-center justify-between gap-2 rounded-[7px] px-3 py-2.5 text-[13px] font-semibold no-underline ${
              active
                ? 'bg-white text-[#142438]'
                : 'text-[#d7e2ed] hover:bg-white/10 hover:text-white'
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

  return (
    <div className="employer-dash min-h-screen bg-[#f4f5f7] text-ink">
      <details className="group border-b border-[#1e334d] bg-[#142438] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-white [&::-webkit-details-marker]:hidden">
          <Wordmark href="/admin/employer" size={22} tone="dark" accent="employer" />
          <span className="rounded-md border border-white/25 px-2.5 py-1 text-[12px] font-medium tracking-wide uppercase">
            Menu
          </span>
        </summary>
        <div className="border-t border-white/10 pb-4 pt-2">
          {navList}
          {support ? <SupportCard href={support} /> : null}
        </div>
      </details>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col bg-[#142438] text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Wordmark href="/admin/employer" size={26} tone="dark" accent="employer" />
        </div>
        <p className="m-0 px-5 pb-1 text-[10px] font-semibold tracking-[0.14em] text-[#a8bcd0] uppercase">Hiring workspace</p>
        {navList}
        {support ? (
          <div className="mt-auto border-t border-white/10 p-4">
            <SupportCard href={support} />
          </div>
        ) : (
          <div className="mt-auto" />
        )}
      </aside>

      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-20 border-b border-[#dfe6ee] bg-white text-[#142438]">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-[27px]">
            <div className="min-w-0 flex-1">
              <ConsoleSearch pages={searchPages} targets={searchTargets} live={false} />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ProfileMenu
                name={companyName}
                email={email}
                roleLabel={verified ? 'Verified Employer' : 'Employer'}
                avatarUrl={avatarUrl}
                links={[
                  { href: '/admin/vacancies#company', label: 'Company profile' },
                  { href: '/admin/billing', label: 'Billing & Plans' },
                ]}
              />
            </div>
          </div>
        </header>
        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-[30px] lg:py-8">{children}</div>
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
    case 'billing':
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18M7 14h4" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
