import { NextResponse } from 'next/server';
import { registerSchema, toE164 } from '@/lib/validation';
import { COHORT } from '@/lib/data/cohort';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { identityHash } from '@/lib/hash';
import { sendVerificationLink } from '@/lib/email/verification';
import { clientIp, rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { TURNSTILE_HEADER, verifyTurnstile } from '@/lib/security/turnstile';

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
  const ip = clientIp(request);
  const limited = await rateLimit(RATE_LIMITS.register, ip);
  if (!limited.ok) return rateLimitedResponse(limited);

  /* Checked before anything touches Supabase, so a script cannot create
     accounts or send verification emails in bulk. */
  if (!(await verifyTurnstile(request.headers.get(TURNSTILE_HEADER), ip))) {
    return NextResponse.json({ status: 'challenge_failed', error: 'challenge_failed' }, { status: 403 });
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const email = input.email.toLowerCase();
  /**
   * E.164, and the hash is of the whole number.
   *
   * It used to be `+91` glued to ten digits, and the hash was of the national
   * part alone. With candidates from two hundred countries that is a collision
   * waiting to happen: 50 123 4567 is a real number in several of them, and two
   * different people would have shared a `phone_hash` and therefore a row.
   */
  const phone = toE164(input.country, input.mobile);
  if (!phone) {
    return NextResponse.json(
      { error: 'validation_failed', issues: { mobile: ['invalid_mobile'] } },
      { status: 422 },
    );
  }
  const phoneHash = identityHash(phone);
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
   * Three things can happen, and the design only works if all three end with a
   * session on this response. Leaving any of them to the Supabase dashboard
   * means a setting someone changes in a tab silently turns this back into the
   * flow it replaced.
   *
   *  1. "Confirm email" off: `signUp` returns a session. Done.
   *  2. "Confirm email" on: `signUp` succeeds and withholds the session, so we
   *     sign in with the password we just set.
   *  3. The mailer is down or rate limited: `signUp` fails outright with
   *     "Error sending confirmation email" and no account exists at all. The
   *     account is then created with the service role, already confirmed, and
   *     signed in the same way.
   *
   * Case 3 is not hypothetical. Supabase's built-in sender does two messages an
   * hour for the whole project, so on the first busy morning every registration
   * would have failed on a screen that said only "something went wrong".
   */
  let userId: string | null = null;

  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
  });

  if (signUpError) {
    /* Rate limiting here is Supabase's auth limit, not the mailer's, and it
       does mean "come back later". */
    if (signUpError.status === 429) {
      return NextResponse.json({ status: 'rate_limited' }, { status: 429 });
    }

    console.error('[register] signUp failed', signUpError.status, signUpError.message);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      /* Confirmed at creation because nothing was ever sent. The address is
         still unproved as far as this product is concerned: that is tracked by
         `candidates.email_verified_at`, which only a followed link sets. */
      email_confirm: true,
    });

    if (createError || !created.user) {
      console.error('[register] admin create failed', createError?.message);
      return NextResponse.json({ error: 'signup_failed' }, { status: 502 });
    }
    userId = created.user.id;
  } else {
    userId = signUp.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: 'signup_failed' }, { status: 502 });
  }

  /* Whatever happened above, finish holding a session. */
  const { data: current } = await supabase.auth.getUser();
  if (!current.user) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (signInError) {
      console.error('[register] post-signup sign-in failed', signInError.message);
      return NextResponse.json({ error: 'signup_failed' }, { status: 502 });
    }
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
        auth_user_id: userId,
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
   *
   * Sent by us, over Resend. It used to be `signInWithOtp`, which hands the
   * sending to Supabase's own mailer, and that silently delivered nothing.
   */
  const verification = await sendVerificationLink({
    email,
    name: input.fullName,
    locale,
    origin: new URL(request.url).origin,
  });
  if (!verification.sent) {
    console.error('[register] verification email failed', verification.reason);
  }

  return NextResponse.json({
    status: 'created',
    candidateId: candidate.id,
    verificationSent: verification.sent,
  });
}
