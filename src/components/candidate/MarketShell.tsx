'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { HeroRouteMap } from '@/components/cms/HeroRouteMap';

/**
 * The shopfront palette stays off the tools: dashboard, assessment and the
 * account screens. Everything else a candidate lands on from WhatsApp or
 * search is the marketing site.
 */
const QUIET = /\/(dashboard|assessment|signin|signup|go|reset-password)(\/|$)/;

export function MarketShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '';
  if (QUIET.test(path)) return children;
  return (
    <div className="market relative">
      <div aria-hidden className="market-map pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <HeroRouteMap />
      </div>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
