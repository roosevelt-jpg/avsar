import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { LocaleToggle } from '@/components/candidate/LocaleToggle';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';
import { whatsappHref } from '@/lib/cms/settings';

export type DashNavKey =
  | 'overview'
  | 'jobs'
  | 'applications'
  | 'assessment'
  | 'profile'
  | 'relocation'
  | 'saved'
  | 'settings';

type ShellCandidate = {
  fullName: string;
  emailConfirmed: boolean;
};

/**
 * Candidate dashboard chrome from the S&A mockup: navy sidebar, top search
 * bar, and a content column. Nav keys stay wired to real routes; nothing here
 * invents a messages product we do not have.
 */
export async function CandidateDashShell({
  locale,
  current,
  candidate,
  savedCount = 0,
  whatsapp = '',
  children,
}: {
  locale: Locale;
  current: DashNavKey;
  candidate: ShellCandidate;
  savedCount?: number;
  whatsapp?: string;
  children: React.ReactNode;
}) {
  const firstName = candidate.fullName.split(' ')[0] ?? candidate.fullName;
  const initials = candidate.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const support = whatsapp ? whatsappHref(whatsapp) : '';
  const jobsHref = localePath(locale, '/jobs');

  const items: {
    key: DashNavKey;
    href: string;
    label: string;
    badge?: number;
  }[] = [
    { key: 'overview', href: localePath(locale, '/dashboard'), label: 'Dashboard' },
    { key: 'jobs', href: jobsHref, label: 'Job Opportunities' },
    { key: 'applications', href: localePath(locale, '/dashboard/applications'), label: 'My Applications' },
    { key: 'assessment', href: localePath(locale, '/assessment'), label: 'Skills Assessments' },
    { key: 'profile', href: localePath(locale, '/profile'), label: 'My CV & Documents' },
    { key: 'relocation', href: localePath(locale, '/dashboard/relocation'), label: 'Visa & Relocation' },
    {
      key: 'saved',
      href: `${localePath(locale, '/dashboard')}#saved`,
      label: 'Saved Jobs',
      badge: savedCount > 0 ? savedCount : undefined,
    },
    { key: 'settings', href: localePath(locale, '/profile'), label: 'Profile Settings' },
  ];

  const navList = (
    <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-0.5 px-3 py-2">
      {items.map((item) => {
        const active = item.key === current;
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
              <NavIcon name={item.key} />
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
    <div className="candidate-dash min-h-screen bg-[#f4f2ee] text-ink">
      {/* Mobile: collapsible navy drawer via native details — no client JS. */}
      <details className="group border-b border-[#1e334d] bg-[#142438] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-white [&::-webkit-details-marker]:hidden">
          <Wordmark href={localePath(locale, '/')} size={22} tone="dark" />
          <span className="rounded-md border border-white/25 px-2.5 py-1 text-[12px] font-medium tracking-wide uppercase">
            Menu
          </span>
        </summary>
        <div className="border-t border-white/10 pb-4 pt-2">
          {navList}
          {support ? (
            <div className="mx-3 mt-2 rounded-[14px] border border-white/10 bg-[#1a2d45] p-3">
              <p className="m-0 text-[13px] font-medium text-white">Need Help?</p>
              <a
                href={support}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex w-full items-center justify-center rounded-[8px] bg-[#b28a49] px-3 py-2 text-[13px] font-semibold text-[#142438] no-underline"
              >
                Contact Support →
              </a>
            </div>
          ) : null}
        </div>
      </details>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col bg-[#142438] text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Wordmark href={localePath(locale, '/')} size={26} tone="dark" />
        </div>
        {navList}
        {support ? (
          <div className="mt-auto border-t border-white/10 p-4">
            <div className="rounded-[14px] border border-white/10 bg-[#1a2d45] p-3.5">
              <p className="m-0 text-[13px] font-medium text-white">Need Help?</p>
              <p className="m-0 mt-1 text-[12px] leading-snug text-white/55">
                WhatsApp our desk if something on your application looks wrong.
              </p>
              <a
                href={support}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center rounded-[8px] bg-[#b28a49] px-3 py-2.5 text-[13px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
              >
                Contact Support →
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-auto" />
        )}
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 border-b border-[#142438]/10 bg-[#142438] text-white">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <form action={jobsHref} method="get" className="relative min-w-0 flex-1">
              <label htmlFor="dash-job-search" className="sr-only">
                Search jobs
              </label>
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#142438]/45" aria-hidden>
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="dash-job-search"
                name="q"
                type="search"
                placeholder="Search jobs, employers or keywords..."
                className="w-full rounded-full border-0 bg-white py-2.5 pr-4 pl-10 text-[14px] text-[#142438] outline-none placeholder:text-[#142438]/45"
              />
            </form>
            <div className="flex items-center gap-2 sm:gap-3">
              <LocaleToggle locale={locale} />
              <span
                title={firstName}
                className="flex size-9 items-center justify-center rounded-full bg-[#b28a49] text-[12px] font-semibold text-[#142438]"
              >
                {initials || '?'}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="t-colors cursor-pointer rounded-full border border-white/25 bg-transparent px-3 py-1.5 text-[12px] font-medium text-white/85 hover:bg-white/10"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: DashNavKey }) {
  const common = 'size-[18px] shrink-0';
  switch (name) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'jobs':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case 'applications':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
        </svg>
      );
    case 'assessment':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" />
        </svg>
      );
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" strokeLinecap="round" />
        </svg>
      );
    case 'relocation':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M3 21h18M5 21V10l7-6 7 6v11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case 'saved':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinejoin="round" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
