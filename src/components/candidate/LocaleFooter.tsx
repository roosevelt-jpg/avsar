'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Shows the marketing footer on public shopfront pages only.
 *
 * Dashboard, assessment and profile use their own shell — the site footer
 * must not appear under them. Auth and /go are quiet for the same reason.
 *
 * The footer itself is an async Server Component; this wrapper only reads
 * the pathname and decides whether to render the children the layout passed
 * in. Importing SiteFooter here would pull it into the client bundle and
 * break (async client components are not allowed).
 */
const HIDE_FOOTER = /\/(dashboard|assessment|profile|signin|signup|go|reset-password|applicant)(\/|$)/;

export function LocaleFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  if (HIDE_FOOTER.test(pathname)) return null;
  return children;
}
