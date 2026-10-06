import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { getViewer, resolveDestination } from '@/lib/auth';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

export const runtime = 'nodejs';

/**
 * Where an email link lands.
 *
 * A one-time code and a magic link are the same grant delivered two ways, so
 * both end up here and are routed by role. Without this, clicking the link drops
 * the visitor on the Site URL configured in the Supabase dashboard, which has
 * nothing to do with where they were going.
 *
 * Two shapes arrive here. A sign-in code goes through `exchangeCodeForSession`,
 * because `@supabase/ssr` uses PKCE and the exchange is what sets the cookies.
 * The verification link carries a `token_hash` instead: it is minted with the
 * service role and sent by us, so there is no PKCE verifier in the browser to
 * exchange against, and `verifyOtp` is what turns the hash into a session.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const next = url.searchParams.get('next') ?? undefined;
  /* Set by the link sent at registration. Following it is the proof. */
  const verifying = url.searchParams.get('verify') === '1';
  const rawLocale = url.searchParams.get('locale') ?? '';
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.redirect(`${url.origin}/${locale}`);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/callback] exchange failed', error.message);
      return NextResponse.redirect(`${url.origin}/${locale}/signin?error=link_expired`);
    }
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash });
    if (error) {
      console.error('[auth/callback] verifyOtp failed', error.message);
      return NextResponse.redirect(`${url.origin}/${locale}/signin?error=link_expired`);
    }
  }

  const viewer = await getViewer();
  if (viewer.role === 'anonymous') {
    return NextResponse.redirect(`${url.origin}/${locale}/signin`);
  }

  /**
   * Stamp the address as proved.
   *
   * Only ever on the way in through a link that was sent to that address, and
   * only for the candidate whose session this now is, so it cannot be set for
   * anyone else. Supabase's own `email_confirmed_at` is not used: with
   * confirmation off, every account carries it from birth and it proves
   * nothing. A failure here is logged and ignored, because refusing the
   * sign-in over it would lock out the person who just did the right thing.
   */
  if (verifying && viewer.role === 'candidate' && !viewer.candidate.emailConfirmed) {
    const { error } = await supabase
      .from('candidates')
      .update({ email_verified_at: new Date().toISOString() })
      .eq('id', viewer.candidate.id);
    if (error) console.error('[auth/callback] verification stamp failed', error.message);
  }

  return NextResponse.redirect(`${url.origin}${resolveDestination(viewer, next, locale)}`);
}
