import { NextResponse } from 'next/server';
import { getFunnelStats } from '@/lib/stats/funnel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The live funnel counts for the "Live odds" block, which polls this while
 * the page is open. Aggregates only. Cached at the edge for a minute, so a
 * busy page costs one database read a minute however many people have it open.
 */
export async function GET() {
  const stats = await getFunnelStats();
  return NextResponse.json(stats, {
    headers: { 'cache-control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' },
  });
}
