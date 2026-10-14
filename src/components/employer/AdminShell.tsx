import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { AccountMenu } from '@/components/auth/AccountMenu';

/**
 * The frame every staff and employer screen sits in.
 *
 * It exists because the navigation was written inline on the search page and
 * linked to three sections that had never been built, so a recruiter clicking
 * Shortlists got a 404. One definition means a link and the page behind it are
 * added together or not at all.
 */

type Item = { href: string; label: string; staffOnly?: boolean };

const ITEMS: Item[] = [
  { href: '/admin', label: 'Search' },
  { href: '/admin/shortlists', label: 'Shortlists' },
  { href: '/admin/placements', label: 'Placements' },
  { href: '/admin/cvs', label: 'CV queue', staffOnly: true },
  { href: '/admin/employers', label: 'Employers', staffOnly: true },
  { href: '/admin/cohorts', label: 'Cohorts', staffOnly: true },
];

export function AdminShell({
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
  return (
    <div className="avsar-root">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href="/employers" suffix={suffix ?? 'talent pool'} accent="employer" />
        <nav className="flex flex-wrap gap-[clamp(12px,2.4cqi,28px)] text-[15px] text-ink-2">
          {ITEMS.filter((item) => isStaff || !item.staffOnly).map((item) =>
            item.href === current ? (
              <span key={item.href} aria-current="page" className="font-medium text-ink">
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="t-colors no-underline hover:text-employer"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <AccountMenu locale="en" tone="employer" />
      </header>

      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(28px,4cqi,48px)]">{children}</main>
    </div>
  );
}

/** The heading block the inner pages share. */
export function AdminHeading({ title, lead }: { title: string; lead?: string }) {
  return (
    <>
      <h1 className="m-0 text-[clamp(24px,3cqi,34px)] font-semibold leading-[1.1] tracking-[-0.03em]">
        {title}
      </h1>
      {lead && <p className="mt-3 mb-0 max-w-[72ch] text-[15px] leading-[1.6] text-ink-2">{lead}</p>}
    </>
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
