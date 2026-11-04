'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Marketing palette on public shopfront pages. Dashboard, assessment and
 * account screens stay on the quiet console tokens.
 */
const QUIET = /\/(dashboard|assessment|signin|signup|go|reset-password)(\/|$)/;

export function MarketShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '';
  if (QUIET.test(path)) return children;
  return <div className="market relative bg-white text-[#142438]">{children}</div>;
}
