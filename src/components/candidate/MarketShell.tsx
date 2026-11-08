'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';
import { EnquireDrawer } from '@/components/candidate/EnquireDrawer';
import { ConsentPreferences } from '@/components/candidate/ConsentPreferences';
import { ScrollTop } from '@/components/candidate/ScrollTop';
import { VisitorLeadPopup } from '@/components/candidate/VisitorLeadPopup';

/**
 * Marketing palette on public shopfront pages. Dashboard, assessment and
 * account screens stay on the quiet console tokens. Site chrome (enquire
 * drawer, consent FAB, scroll-top, first-visit lead popup) mounts only for
 * anonymous visitors on marketing routes — never when someone is signed in.
 */
/* Signup keeps the marketing palette so the registration hero matches the shop. */
const QUIET = /\/(dashboard|assessment|profile|signin|go|reset-password|applicant)(\/|$)/;
/* Auth/funnel pages already collect details — do not stack a second form. */
const NO_VISITOR_POPUP = /\/(signup|signin|go|reset-password|applicant|contact)(\/|$)/;

export function MarketShell({
  children,
  locale,
  signedIn = false,
}: {
  children: ReactNode;
  locale: Locale;
  /** From the locale layout — signed-in audiences use dash shells, not shop chrome. */
  signedIn?: boolean;
}) {
  const path = usePathname() ?? '';
  if (QUIET.test(path) || signedIn) return children;
  return (
    <div className="market relative bg-white text-[#142438]">
      {children}
      <EnquireDrawer locale={locale} />
      <ConsentPreferences locale={locale} />
      {NO_VISITOR_POPUP.test(path) ? null : <VisitorLeadPopup locale={locale} />}
      <ScrollTop />
    </div>
  );
}
