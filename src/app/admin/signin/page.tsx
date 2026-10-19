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
  /* Default to the staff dashboard; employers arriving without `next` are
     sent there by resolveDestination after sign-in based on role. */
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin/dashboard';
  redirect(localePath('en', `/signin?next=${encodeURIComponent(target)}`));
}
