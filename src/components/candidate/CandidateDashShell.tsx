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
 * Candidate dashboard chrome: navy sidebar, quiet top bar, content column.
 * Crafted to match S&A marketing navy/gold — not a generic admin kit.
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
    <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-0.5 px-2.5 py-3">
      {items.map((item) => {
        const active = item.key === current;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`t-colors flex items-center justify-between gap-2 rounded-[8px] px-3 py-2.5 text-[13.5px] no-underline ${
              active
                ? 'bg-[var(--dash-gold)] font-semibold text-[var(--dash-navy)]'
                : 'text-white/72 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <NavIcon name={item.key} />
              {item.label}
            </span>
            {item.badge != null ? (
              <span className="rounded-full bg-[var(--dash-gold)] px-1.5 text-[11px] font-semibold text-[var(--dash-navy)]">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="candidate-dash min-h-screen">
      <details className="group border-b border-white/10 bg-[var(--dash-navy)] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-white [&::-webkit-details-marker]:hidden">
          <Wordmark href={localePath(locale, '/')} size={22} tone="dark" />
          <span className="rounded-[6px] border border-white/25 px-2.5 py-1 text-[11px] font-medium tracking-[0.08em] uppercase">
            Menu
          </span>
        </summary>
        <div className="border-t border-white/10 pb-4 pt-1">
          {navList}
          {support ? <SupportCard href={support} compact /> : null}
        </div>
      </details>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col bg-[var(--dash-navy)] text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Wordmark href={localePath(locale, '/')} size={26} tone="dark" />
        </div>
        {navList}
        {support ? (
          <div className="mt-auto border-t border-white/10 p-4">
            <SupportCard href={support} />
          </div>
        ) : (
          <div className="mt-auto" />
        )}
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 border-b border-[var(--dash-navy)]/10 bg-[var(--dash-navy)] text-white">
          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
            <form action={jobsHref} method="get" className="relative min-w-0 flex-1">
              <label htmlFor="dash-job-search" className="sr-only">
                Search jobs
              </label>
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--dash-navy)]/40" aria-hidden>
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
                className="w-full rounded-full border-0 bg-white py-2 pr-4 pl-10 text-[14px] text-[var(--dash-navy)] outline-none placeholder:text-[var(--dash-navy)]/40"
              />
            </form>
            <div className="flex items-center gap-2 sm:gap-3">
              <LocaleToggle locale={locale} />
              <span
                title={firstName}
                className="flex size-8 items-center justify-center rounded-full bg-[var(--dash-gold)] text-[11px] font-semibold text-[var(--dash-navy)]"
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
        <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">{children}</div>
      </div>
    </div>
  );
}

function SupportCard({ href, compact }: { href: string; compact?: boolean }) {
  return (
    <div className={`rounded-[12px] border border-white/10 bg-[var(--dash-navy-deep)] ${compact ? 'mx-3 mt-2 p-3' : 'p-3.5'}`}>
      <p className="m-0 text-[13px] font-medium text-white">Need Help?</p>
      {!compact ? (
        <p className="m-0 mt-1 text-[12px] leading-snug text-white/55">
          WhatsApp our desk if something on your application looks wrong.
        </p>
      ) : null}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 inline-flex w-full items-center justify-center rounded-[8px] bg-[var(--dash-gold)] px-3 py-2 text-[13px] font-semibold text-[var(--dash-navy)] no-underline hover:bg-[var(--dash-gold-soft)]"
      >
        Contact Support →
      </a>
    </div>
  );
}

function NavIcon({ name }: { name: DashNavKey }) {
  const common = 'size-[17px] shrink-0 opacity-90';
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
