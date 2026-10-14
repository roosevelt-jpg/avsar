import { redirect } from 'next/navigation';

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
  redirect(`/en/signin?next=${encodeURIComponent(target)}`);
}
