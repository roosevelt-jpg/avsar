import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Runs before every matched request.
 *
 * Next 16 renamed this convention from `middleware` to `proxy`. It must live
 * inside `src/` here: with a `src` directory, a file at the project root is
 * silently ignored rather than reported as an error.
 *
 * Its only job is refreshing the Supabase session, because Server Components
 * cannot write cookies and the access token would otherwise expire under a
 * signed-in candidate mid-assessment.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Everything except static assets and image files. The auth cookie has to be
   * refreshed on page requests and API routes; running this on every favicon
   * would just burn invocations.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
