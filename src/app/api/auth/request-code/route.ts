import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAnonSupabase } from '@/lib/supabase/anon';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().trim().email().max(200),
  /** Same-origin path to return to after the link is followed. */
  next: z.string().max(300).optional(),
  locale: z.string().max(5).optional(),
});

/**
 * Sends a one-time code, server side.
 *
 * The browser used to call Supabase directly with `shouldCreateUser: false`.
 * That was wrong: a candidate registers and pays before any auth account
 * exists, so Supabase found no user, sent nothing, and said nothing. Every
 * legitimate candidate was locked out.
 *
 * The decision has to be made here because it needs the service role to see
 * whether the address belongs to a registered candidate. The response is
 * identical either way, so this cannot be used to test who has registered.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  /* Even a malformed address gets the neutral answer. */
  if (!parsed.success) return NextResponse.json({ sent: true });

  const email = parsed.data.email.toLowerCase();
  const origin = new URL(request.url).origin;

  const next = parsed.data.next;
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : undefined;

  const callback = new URL('/auth/callback', origin);
  if (safeNext) callback.searchParams.set('next', safeNext);
  if (parsed.data.locale) callback.searchParams.set('locale', parsed.data.locale);
  const anon = getAnonSupabase();
  const admin = getAdminSupabase();

  if (!anon || !admin) {
    return NextResponse.json({ sent: false, reason: 'storage_unconfigured' }, { status: 503 });
  }

  const { data: candidate } = await admin
    .from('candidates')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  /**
   * One call covers all three cases:
   *  - registered candidate, no account yet -> create it and send
   *  - existing account, e.g. staff wanting a code -> send
   *  - neither -> no user, nothing created, nothing sent
   */
  const { error } = await anon.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: Boolean(candidate),
      /* Where the link in the email goes. Must also be listed under
         Authentication -> URL Configuration -> Redirect URLs, or Supabase
         silently falls back to the Site URL. */
      emailRedirectTo: callback.toString(),
    },
  });

  /* Logged, never returned. A delivery failure and an unknown address must
     look the same from outside. */
  if (error) console.error('[request-code] send failed', error.message);

  return NextResponse.json({ sent: true });
}
