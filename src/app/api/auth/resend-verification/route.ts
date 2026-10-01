import { NextResponse } from 'next/server';
import { getSessionCandidate } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Sends the verification link again.
 *
 * The address is read from the session, never from the request, so this cannot
 * be pointed at anyone else's inbox. Nothing is revealed about addresses that
 * are not the caller's own, because the caller only ever has one.
 */
export async function POST(request: Request) {
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  /* Already done. Say so rather than sending a second link that will look like
     the first one failed. */
  if (candidate.emailConfirmed) return NextResponse.json({ status: 'already_verified' });

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const origin = new URL(request.url).origin;
  const callback = new URL('/auth/callback', origin);
  callback.searchParams.set('verify', '1');
  callback.searchParams.set('locale', candidate.locale);

  const { error } = await supabase.auth.signInWithOtp({
    email: candidate.email,
    options: { shouldCreateUser: false, emailRedirectTo: callback.toString() },
  });

  /* Surfaced, because the alternative is someone sitting in front of a screen
     that says a link is on its way when none was sent, waiting, retrying, and
     burning the next allowance too. */
  if (error?.status === 429) {
    return NextResponse.json({ status: 'rate_limited' }, { status: 429 });
  }

  if (error) {
    console.error('[resend-verification] failed', error.status, error.message);
    return NextResponse.json({ error: 'send_failed' }, { status: 502 });
  }

  return NextResponse.json({ status: 'sent' });
}
