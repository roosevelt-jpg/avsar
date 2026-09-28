import { redirect } from 'next/navigation';
import { defaultLocale } from '@/lib/i18n';

/** `next.config.ts` redirects `/` already; this is the belt-and-braces path. */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
