import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation';
import { COHORT } from '@/lib/data/cohort';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { identityHash } from '@/lib/hash';

export const runtime = 'nodejs';

/**
 * Opens the account, at the first step of the application.
 *
 * The session starts here, before the profile and before payment, so nothing
 * in the funnel waits for an email to arrive. That matters more than it looks:
 * on Android a link opened from Gmail lands in Gmail's own browser, so a
 * candidate who verifies there and then returns to Chrome is signed out with
 * no way to understand why. A password, set here, is what makes that
 * recoverable from any browser.
 *
 * Two answers this route gives that Supabase will not give the browser:
 * whether the address already has an account, and whether the phone number
 * already belongs to someone else in this cohort. Both need the service role,
 * and getting either wrong strands a candidate silently.
 */
export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const email = input.email.toLowerCase();
  const phone = `+91${input.mobile}`;
  const phoneHash = identityHash(input.mobile);
  const locale = request.headers.get('x-avsar-locale') ?? 'en';

  const admin = getAdminSupabase();
  const supabase = await getServerSupabase();
  if (!admin || !supabase) {
    return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });
  }

  /**
   * Does this address already have an account?
   *
   * Supabase will not say. `signUp` on an existing address returns an
   * obfuscated user and no error, by design, so that the endpoint cannot be
   * used to enumerate who has registered. That protection becomes a trap when
   * it is our own signup form: the candidate sees "check your email", waits,
   * and never gets in, because the account already exists under a password
   * they set weeks ago. The same shape of silence locked four paying
   * candidates out of this platform once already.
   *
   * So the question is answered here, where the service role can answer it,
   * and the browser is told to go and sign in instead.
   */
  const { data: existing } = await admin
    .from('candidates')
    .select('id, auth_user_id')
    .ilike('email', email)
    .maybeSingle();

  if (existing?.auth_user_id) {
    return NextResponse.json({ status: 'account_exists' });
  }

  /**
   * Is the phone number someone else's?
   *
   * Candidates are unique on (phone_hash, cohort_id) and registration used to
   * upsert on that key, which meant a second person entering the same number
   * overwrote the first person's row, email included. If the first had paid,
   * they lost what they paid for. Refuse instead.
   */
  const { data: phoneOwner } = await admin
    .from('candidates')
    .select('id, email')
    .eq('phone_hash', phoneHash)
    .eq('cohort_id', COHORT.id)
    .maybeSingle();

  if (phoneOwner && (phoneOwner.email as string).toLowerCase() !== email) {
    return NextResponse.json({ status: 'phone_taken' });
  }

  /**
   * Create the account and start the session.
   *
   * Through the SSR client, so the cookies are set on this response. This
   * returns a session only while "Confirm email" is off in the Supabase
   * dashboard; with it on, Supabase withholds the session until the link is
   * followed and this whole design silently becomes the one it replaced. See
   * docs/auth.md.
   */
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
  });

  if (signUpError || !signUp.user) {
    console.error('[register] signUp failed', signUpError?.status, signUpError?.message);
    if (signUpError?.status === 429) {
      return NextResponse.json({ status: 'rate_limited' }, { status: 429 });
    }
    return NextResponse.json({ error: 'signup_failed' }, { status: 502 });
  }

  /**
   * The candidate row, written in the same request.
   *
   * Without it the account exists with nothing attached, which is a state the
   * guards have to handle and nobody can get out of. The profile columns stay
   * null until the next step; the constraint added in 0010 only requires them
   * once the candidate has paid.
   */
  const { data: candidate, error: candidateError } = await admin
    .from('candidates')
    .upsert(
      {
        cohort_id: COHORT.id,
        auth_user_id: signUp.user.id,
        full_name: input.fullName,
        phone,
        phone_hash: phoneHash,
        email,
        has_passport: input.hasPassport,
        payment_status: 'pending',
        locale,
      },
      { onConflict: 'phone_hash,cohort_id' },
    )
    .select('id')
    .single();

  if (candidateError) {
    console.error('[register] candidate upsert failed', candidateError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  /**
   * Ask them to prove the address, without making anything wait for it.
   *
   * This is a magic link rather than a Supabase confirmation link, because
   * confirmation is off: following it is what sets `email_verified_at`, and
   * `email_verified_at` is what releases the report. A failure here is logged
   * and swallowed. The candidate is already signed in and should carry on to
   * the profile; the address can be proved later, and will be asked for again
   * before the report is released.
   */
  const origin = new URL(request.url).origin;
  const callback = new URL('/auth/callback', origin);
  callback.searchParams.set('verify', '1');
  callback.searchParams.set('locale', locale);

  const { error: linkError } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: callback.toString() },
  });
  if (linkError) console.error('[register] verification email failed', linkError.message);

  return NextResponse.json({
    status: 'created',
    candidateId: candidate.id,
    verificationSent: !linkError,
  });
}
