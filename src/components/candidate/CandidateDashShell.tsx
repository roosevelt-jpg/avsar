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
  | 'saved'
  | 'assessment'
  | 'documents'
  | 'relocation'
  | 'messages'
  | 'settings'
  | 'profile';

type ShellCandidate = {
  fullName: string;
  emailConfirmed: boolean;
};

/**
 * Candidate dashboard chrome aligned to the HTML-44 pack: navy sidebar,
 * white active pill, top search. Labels and order match the prototype IA.
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
    { key: 'jobs', href: jobsHref, label: 'Find Jobs' },
    { key: 'applications', href: localePath(locale, '/dashboard/applications'), label: 'My Applications' },
    {
      key: 'saved',
      href: localePath(locale, '/dashboard/saved'),
      label: 'Saved Jobs',
      badge: savedCount > 0 ? savedCount : undefined,
    },
    { key: 'assessment', href: localePath(locale, '/assessment'), label: 'Skills Assessments' },
    { key: 'documents', href: localePath(locale, '/dashboard/documents'), label: 'CV & Documents' },
    { key: 'relocation', href: localePath(locale, '/dashboard/relocation'), label: 'Visa & Relocation' },
    { key: 'messages', href: localePath(locale, '/dashboard/messages'), label: 'Messages' },
    { key: 'settings', href: localePath(locale, '/profile'), label: 'Profile Settings' },
  ];

  const navList = (
    <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-0.5 px-2.5 py-3">
      <p className="m-0 px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-white/45 uppercase">My workspace</p>
      {items.map((item) => {
        const active = item.key === current || (current === 'profile' && item.key === 'settings');
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`t-colors flex items-center justify-between gap-2 rounded-[7px] px-3 py-2.5 text-[13px] font-semibold no-underline ${
              active
                ? 'bg-white text-[var(--dash-navy)]'
                : 'text-[#d7e2ed] hover:bg-white/10 hover:text-white'
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

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col bg-[var(--dash-navy)] text-white lg:flex">
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

      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-20 border-b border-[#dfe6ee] bg-white">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-[27px]">
            <form action={jobsHref} method="get" className="relative min-w-0 flex-1">
              <label htmlFor="dash-job-search" className="sr-only">
                Search jobs
              </label>
              <input
                id="dash-job-search"
                name="q"
                type="search"
                placeholder="Search jobs, candidates, employers…"
                className="w-full max-w-[430px] rounded-[7px] border border-[#ccd7e2] bg-white px-3 py-2.5 text-[14px] text-[var(--dash-navy)] outline-none placeholder:text-[var(--dash-navy)]/40 focus:border-[#b28a49] focus:outline-2 focus:outline-[#b28a49]/35"
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
                  className="t-colors cursor-pointer rounded-[5px] border border-[#8098af] bg-transparent px-3 py-1.5 text-[12px] font-medium text-[var(--dash-navy)] hover:bg-[#f4f5f7]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="workmain px-4 py-5 sm:px-6 sm:py-6 lg:px-[30px] lg:py-7">{children}</div>
      </div>
    </div>
  );
}

function SupportCard({ href, compact }: { href: string; compact?: boolean }) {
  return (
    <div className={compact ? 'mx-3 mt-2 px-1 py-2' : 'px-1 py-1'}>
      <p className="m-0 text-[12px] font-medium uppercase tracking-[0.08em] text-white/45">Need help?</p>
      {!compact ? (
        <p className="m-0 mt-1 text-[12px] leading-snug text-white/55">
          WhatsApp our desk if something on your application looks wrong.
        </p>
      ) : null}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex text-[13px] font-semibold text-[var(--dash-gold)] no-underline hover:underline"
      >
        Contact support →
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
    case 'documents':
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
    case 'messages':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeLinejoin="round" />
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
