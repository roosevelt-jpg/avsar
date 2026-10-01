import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import { getViewer } from '@/lib/auth';
import { getDictionary, type Locale } from '@/lib/i18n';

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
      <Link href={`/${locale}/signin`} className="px-2.5 py-2 text-[15px] no-underline text-ink">
        {t.signIn}
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
    links.push({ href: `/${locale}/dashboard`, label: t.dash.navOverview });
  } else {
    /* Signed in with no candidate row. Say so plainly and offer the one thing
       that moves them forward, rather than printing an empty name. */
    who = viewer.email.split('@')[0] ?? '';
    links.push({ href: `/${locale}/signup`, label: t.dash.navOverview });
  }

  return (
    <span className="flex flex-wrap items-center gap-3">
      <Mono className="text-muted">{who}</Mono>
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
