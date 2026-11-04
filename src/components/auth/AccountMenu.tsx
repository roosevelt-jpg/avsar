import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import { getViewer } from '@/lib/auth';
import { getDictionary, type Locale, localePath } from '@/lib/i18n';

/**
 * Who you are and where you can go, in every header.
 *
 * The same component on the candidate site, the employer site and the internal
 * console, so moving between them never looks like leaving the product. What it
 * offers is derived from the session, so it cannot advertise a surface the
 * viewer would then be refused.
 */
export async function AccountMenu({
  locale,
  tone = 'candidate',
}: {
  locale: Locale;
  tone?: 'candidate' | 'employer';
}) {
  const t = getDictionary(locale);
  const viewer = await getViewer();

  const hover = tone === 'employer' ? 'hover:text-employer' : 'hover:text-accent';

  if (viewer.role === 'anonymous') {
    return (
      /* Mockup: outline “Sign In” on the navy header. Icon-only under sm so
         long scripts do not shove the menu off a phone. */
      <Link
        href={localePath(locale, '/applicant/signin')}
        title={t.signIn}
        className="inline-flex items-center rounded-[8px] border border-white/55 px-3.5 py-2 text-[14px] font-medium text-white no-underline hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" className="size-5 sm:hidden" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19.5c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5" strokeLinecap="round" />
        </svg>
        <span className="sr-only sm:not-sr-only">{t.signIn}</span>
      </Link>
    );
  }

  const links: { href: string; label: string }[] = [];
  let who = '';

  if (viewer.role === 'staff') {
    who = 'Staff';
    links.push({ href: '/admin', label: 'Talent pool' });
  } else if (viewer.role === 'employer') {
    who = viewer.employer.name || 'Employer';
    links.push({ href: '/admin/employer', label: 'Talent pool' });
  } else if (viewer.role === 'candidate') {
    who = viewer.candidate.fullName.split(' ')[0] ?? '';
    links.push({ href: localePath(locale, '/dashboard'), label: t.dash.navOverview });
  } else {
    /* Signed in with no candidate row. Say so plainly and offer the one thing
       that moves them forward, rather than printing an empty name. */
    who = viewer.email.split('@')[0] ?? '';
    links.push({ href: localePath(locale, '/signup'), label: t.dash.navOverview });
  }

  return (
    /* On phones keep one control; full labels appear from md so the header
       never overflows beside the language menu. */
    <span className="flex items-center gap-1.5 sm:gap-3">
      <Mono className="hidden text-muted 2xl:inline">{who}</Mono>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          title={link.label}
          className={`t-colors text-[15px] no-underline text-ink-2 ${hover}`}
        >
          <svg viewBox="0 0 24 24" className="size-5 md:hidden" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" strokeLinejoin="round" />
          </svg>
          <span className="sr-only md:not-sr-only">{link.label}</span>
        </Link>
      ))}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          title={t.auth.signOut}
          className={`t-colors cursor-pointer border-0 bg-transparent px-1 py-2 text-[15px] text-ink-2 ${hover}`}
        >
          <span className="sr-only md:not-sr-only">{t.auth.signOut}</span>
          <svg viewBox="0 0 24 24" className="size-5 md:hidden" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path d="M10 7V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-2M14 12H4m0 0 3-3M4 12l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </span>
  );
}
