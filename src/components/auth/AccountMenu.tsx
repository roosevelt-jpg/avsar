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
      /* An icon on phones: "Sign in" runs to fourteen characters in Malayalam
         and Tamil, which pushed the menu button off a 360px screen. The word
         stays as the accessible name and returns from the sm breakpoint. */
      <Link href={localePath(locale, '/signin')} title={t.signIn} className="inline-flex items-center px-2.5 py-2 text-[15px] no-underline text-ink">
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
    links.push({ href: '/admin', label: 'Talent pool' });
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
    /* nowrap: in the site header this sits beside the main menu, and a wrapped
       "Sign out" would push the menu links under the language button. */
    <span className="flex items-center gap-3 whitespace-nowrap">
      <Mono className="hidden text-muted 2xl:inline">{who}</Mono>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-[15px] no-underline text-ink-2 t-colors ${hover}`}
        >
          {link.label}
        </Link>
      ))}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className={`t-colors cursor-pointer border-0 bg-transparent px-1 py-2 text-[15px] text-ink-2 ${hover}`}
        >
          {t.auth.signOut}
        </button>
      </form>
    </span>
  );
}
