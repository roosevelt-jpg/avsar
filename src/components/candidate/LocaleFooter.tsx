'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Shows the site footer on every candidate locale page except sign-in,
 * sign-up and the /go funnel.
 *
 * The footer itself is an async Server Component; this wrapper only reads
 * the pathname and decides whether to render the children the layout passed
 * in. Importing SiteFooter here would pull it into the client bundle and
 * break (async client components are not allowed).
 */
export function LocaleFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  if (
    pathname.endsWith('/signin') ||
    pathname.endsWith('/signup') ||
    pathname.endsWith('/go') ||
    pathname.endsWith('/reset-password')
  ) {
    return null;
  }
  return children;
}
