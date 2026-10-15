import { NextResponse } from 'next/server';
import { apiStaff } from '@/lib/rbac/server';
import { rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { searchConsole } from '@/lib/search/console';

export const runtime = 'nodejs';

/** The console header search. Staff only; each result type is gated by its own permission. */
export async function GET(request: Request) {
  const guard = await apiStaff();
  if (guard instanceof NextResponse) return guard;

  const limited = await rateLimit(RATE_LIMITS.consoleSearch, guard.userId);
  if (!limited.ok) return rateLimitedResponse(limited);

  const q = new URL(request.url).searchParams.get('q') ?? '';
  const hits = await searchConsole(guard, q);
  return NextResponse.json({ hits }, { headers: { 'Cache-Control': 'no-store' } });
}
