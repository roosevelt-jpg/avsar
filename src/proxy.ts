import { NextResponse, type NextRequest } from 'next/server';
import { englishRedirectPath, englishRewritePath } from '@/lib/i18n/path';
import { newRequestId, REQUEST_ID_HEADER } from '@/lib/observability/log';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Runs before every matched request.
 *
 * Next 16 renamed this convention from `middleware` to `proxy`. It must live
 * inside `src/` here: with a `src` directory, a file at the project root is
 * silently ignored rather than reported as an error.
 *
 * It refreshes the Supabase session, because Server Components cannot write
 * cookies and the access token would otherwise expire under a signed-in
 * candidate mid-assessment, and it stamps every request with an id for the logs.
 */
export async function proxy(request: NextRequest) {
  /* Every request gets an id, set on the request so route handlers and the
     error reporter can log it, and on the response so the browser can show
     it. A caller-supplied id is ignored: it would let anyone write whatever
     they liked into the logs. */
  const id = newRequestId();
  request.headers.set(REQUEST_ID_HEADER, id);
  const response = await route(request);
  response.headers.set(REQUEST_ID_HEADER, id);
  return response;
}

async function route(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  /* Old English links (/en, /en/jobs) become the bare URL. Hindi and Arabic stay. */
  const stripped = englishRedirectPath(pathname);
  if (stripped) {
    const url = request.nextUrl.clone();
    url.pathname = stripped;
    return NextResponse.redirect(url, 308);
  }

  /* / and /jobs render the English locale route without changing the address bar. */
  const internal = englishRewritePath(pathname);
  if (internal) {
    const url = request.nextUrl.clone();
    url.pathname = internal;
    return updateSession(request, () => NextResponse.rewrite(url, { request }));
  }

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
