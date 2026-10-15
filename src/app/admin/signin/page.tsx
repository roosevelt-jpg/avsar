import { redirect } from 'next/navigation';
import { localePath } from '@/lib/i18n';

/**
 * Kept so old links and bookmarks still work. There is one sign-in page now.
 */
export default async function LegacyStaffSignIn({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
  redirect(localePath('en', `/signin?next=${encodeURIComponent(target)}`));
}
