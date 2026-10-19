import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { AccountMenu } from '@/components/auth/AccountMenu';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';

/**
 * The candidate dashboard's header. One definition, so every dashboard page
 * offers the same way around and marks where you are.
 */
export function DashboardNav({ locale, current }: { locale: Locale; current: 'overview' | 'applications' | 'relocation' | 'jobs' | 'profile' }) {
  const items = [
    { key: 'overview', href: localePath(locale, '/dashboard'), label: 'Overview' },
    { key: 'applications', href: localePath(locale, '/dashboard/applications'), label: 'My applications' },
    { key: 'relocation', href: localePath(locale, '/dashboard/relocation'), label: 'Your move' },
    { key: 'jobs', href: localePath(locale, '/jobs'), label: 'Find jobs' },
    { key: 'profile', href: localePath(locale, '/profile'), label: 'Profile' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/80 px-[clamp(20px,4cqi,56px)] py-[14px] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Wordmark href={localePath(locale, '/')} size={26} />
        <nav aria-label="Dashboard" className="order-3 flex w-full gap-1 overflow-x-auto text-[15px] sm:order-none sm:w-auto">
          {items.map((item) =>
            item.key === current ? (
              <span
                key={item.key}
                aria-current="page"
                className="whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 font-medium text-paper shadow-[0_8px_20px_-12px_rgba(27,26,23,0.55)]"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.key}
                href={item.href}
                className="t-colors whitespace-nowrap rounded-full px-3.5 py-1.5 text-ink-2 no-underline hover:bg-surface hover:text-ink"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <AccountMenu locale={locale} />
      </div>
    </header>
  );
}
