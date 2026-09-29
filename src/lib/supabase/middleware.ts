import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

/**
 * Refreshes the auth session on every request and writes the rotated cookies
 * onto the response.
 *
 * Server Components cannot set cookies, so without this the access token
 * silently expires and a signed-in candidate gets bounced to sign-in
 * mid-assessment. This is the only place cookies are actually written.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  /* getUser, not getSession: it revalidates the token against the auth server
     rather than trusting whatever is in the cookie. */
  await supabase.auth.getUser();

  return response;
}
