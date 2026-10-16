'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import type { Locale } from '@/lib/i18n';

/**
 * Site footer for every candidate locale page except sign-in and sign-up.
 *
 * Those two pages are full-viewport auth screens with the hero atmosphere;
 * a marketing footer under them breaks the composition. Path is read on the
 * client because the locale layout cannot know which child route rendered.
 */
export function LocaleFooter({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? '';
  if (pathname.endsWith('/signin') || pathname.endsWith('/signup')) return null;
  return <SiteFooter locale={locale} />;
}
