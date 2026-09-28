import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validation';
import { ACTIVE_TIER, COHORT, activePrice } from '@/lib/data/cohort';
import { getPaymentProvider, receiptNumber } from '@/lib/payments';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { identityHash } from '@/lib/hash';

export const runtime = 'nodejs';

/**
 * Registers a candidate and opens a checkout session.
 *
 * The candidate row is written before payment with `payment_status: 'pending'`
 * so an abandoned checkout stays visible in the funnel, and so the webhook has a
 * row to attach the payment to.
 *
 * The price is read from the server. The client never sends an amount.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const price = activePrice();
  const supabase = getAdminSupabase();
  const provider = getPaymentProvider();
  const locale = request.headers.get('x-avsar-locale') ?? 'en';

  const serial = Math.floor(Math.random() * 999_999);
  const receipt = receiptNumber(1, serial);

  let candidateId: string | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from('candidates')
      .upsert(
        {
          cohort_id: COHORT.id,
          full_name: input.fullName,
          phone: `+91${input.mobile}`,
          phone_hash: identityHash(input.mobile),
          email: input.email,
          has_passport: input.hasPassport,
          sector: input.sector,
          years_experience_band: input.yearsExperience,
          english_self_rating: input.englishSelf,
          city_state: input.cityState,
          payment_status: 'pending',
          /* Stored, not just validated: this is the odds-disclosure consent, and
             it is the record that matters if the fee model is ever challenged. */
          consent_selection_odds_at: new Date().toISOString(),
          consent_version: 'v1-2026-09',
          locale,
        },
        { onConflict: 'phone_hash,cohort_id' },
      )
      .select('id')
      .single();

    if (error) {
      console.error('[signup] candidate upsert failed', error);
      return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
    }
    candidateId = data.id as string;
  }

  const origin = new URL(request.url).origin;

  let session;
  try {
    session = await provider.createCheckout({
      amountMinor: price.totalPaise,
      currency: 'INR',
      receipt,
      description: `Avsar ${COHORT.name} assessment`,
      customer: {
        name: input.fullName,
        email: input.email,
        phone: `+91${input.mobile}`,
      },
      methodHint: input.method,
      successUrl: `${origin}/${locale}/signup?status=success&receipt=${receipt}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/${locale}/signup?status=cancelled`,
      metadata: {
        cohort: COHORT.id,
        sector: input.sector,
        tier: ACTIVE_TIER,
        receipt,
        candidate_id: candidateId ?? 'unstored',
      },
    });
  } catch (error) {
    console.error('[signup] checkout creation failed', error);
    return NextResponse.json({ error: 'payment_init_failed' }, { status: 502 });
  }

  if (supabase && candidateId) {
    const { error } = await supabase.from('payments').insert({
      candidate_id: candidateId,
      cohort_id: COHORT.id,
      provider: provider.name,
      provider_order_id: session.id,
      amount_paise: price.totalPaise,
      net_paise: price.netPaise,
      gst_paise: price.gstPaise,
      method_hint: input.method,
      status: session.simulated ? 'simulated' : 'created',
      receipt_no: receipt,
    });
    if (error) console.error('[signup] payment insert failed', error);
  }

  return NextResponse.json({
    candidateId,
    receipt,
    sessionId: session.id,
    redirectUrl: session.redirectUrl,
    simulated: session.simulated,
    provider: provider.name,
  });
}
