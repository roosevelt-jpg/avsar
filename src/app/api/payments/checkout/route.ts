import { NextResponse } from 'next/server';
import { ACTIVE_TIER, COHORT, activePrice, chargeAmountMinor, CHARGE_CURRENCY } from '@/lib/data/cohort';
import { BRAND, PLACEMENT_FEE_UNDISCLOSED } from '@/lib/data/brand';
import { getPaymentProvider, receiptNumber } from '@/lib/payments';
import { paymentMethodSchema } from '@/lib/validation';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getSessionCandidate } from '@/lib/auth';
import { getCandidateStatus } from '@/lib/candidate/status';

export const runtime = 'nodejs';

/**
 * Opens checkout for the assessment fee.
 *
 * Its own route, because the fee is no longer part of signing up. A candidate
 * registers, fills in a profile and sits the assessment for nothing; this is
 * what they call when they want the report, the career pack and the CV.
 *
 * Which candidate is read from the session. The price is read from the server.
 * Neither has ever come from the request and neither starts now.
 */
export async function POST(request: Request) {
  /**
   * Refuses while the placement fee is withheld from the site.
   *
   * The assessment fee is what induces payment, and a candidate who pays it
   * without having been told that €1,000 follows if they are placed has been
   * charged on an omission of the one term with the most consequence attached.
   * The product's own note on `PLACEMENT_FEE` is blunt about why that term
   * matters: it is above India's Emigration Act cap and it is the shape
   * anti-trafficking frameworks read as a debt bondage indicator.
   *
   * Nothing is lost today, because no provider is configured and no money can
   * move. This is here so that the day one is, the hidden state cannot become
   * a paying state without somebody deciding to. Either disclose it again or
   * move `payer` to 'employer'; both close this.
   */
  if (PLACEMENT_FEE_UNDISCLOSED) {
    console.error('[checkout] refused: placement fee is withheld from candidates');
    return NextResponse.json({ error: 'disclosure_incomplete' }, { status: 503 });
  }

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  if (candidate.paymentStatus === 'paid') {
    return NextResponse.json({ error: 'already_paid' }, { status: 409 });
  }

  const body = (await request.json().catch(() => null)) as { method?: unknown } | null;
  const method = paymentMethodSchema.safeParse(body?.method);
  if (!method.success) return NextResponse.json({ error: 'invalid_method' }, { status: 400 });

  /**
   * The fee is asked for after the assessment, so there has to be an assessment.
   *
   * Without this check a candidate could be charged for a report that will not
   * exist, which is the one failure in this flow that takes money and gives
   * nothing. The dashboard does not offer the button before this is true; the
   * check is here because a button is not a control.
   */
  const status = await getCandidateStatus(candidate.id, candidate.paymentStatus);
  if (!status.assessmentComplete) {
    return NextResponse.json({ error: 'assessment_incomplete' }, { status: 409 });
  }

  const supabase = getAdminSupabase();
  const provider = getPaymentProvider();
  const price = activePrice();
  const locale = candidate.locale;

  const receipt = receiptNumber(1, Math.floor(Math.random() * 999_999));
  const origin = new URL(request.url).origin;

  let session;
  try {
    session = await provider.createCheckout({
      amountMinor: chargeAmountMinor(),
      currency: CHARGE_CURRENCY,
      receipt,
      description: `${BRAND.name} assessment`,
      customer: { name: candidate.fullName, email: candidate.email, phone: '' },
      methodHint: method.data,
      successUrl: `${origin}/${locale}/dashboard?paid=${receipt}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/${locale}/dashboard?status=cancelled`,
      metadata: {
        cohort: COHORT.id,
        tier: ACTIVE_TIER,
        receipt,
        candidate_id: candidate.id,
        webhook_url: `${origin}/api/payments/webhook`,
      },
    });
  } catch (error) {
    console.error('[checkout] creation failed', error);
    return NextResponse.json({ error: 'payment_init_failed' }, { status: 502 });
  }

  /* Deliberate opt-in, never "the keys happen to be missing". See the note in
     /api/signup: a missing key in a real deployment must not hand out free
     reports. */
  const treatAsPaid = session.simulated && process.env.ALLOW_SIMULATED_PAYMENTS === 'true';

  if (supabase) {
    if (treatAsPaid) {
      await supabase.from('candidates').update({ payment_status: 'paid' }).eq('id', candidate.id);
    }

    const { error } = await supabase.from('payments').insert({
      candidate_id: candidate.id,
      cohort_id: COHORT.id,
      provider: provider.name,
      provider_order_id: session.id,
      amount_paise: price.totalMinor,
      net_paise: price.netMinor,
      gst_paise: price.vatMinor,
      method_hint: method.data,
      status: session.simulated ? 'simulated' : 'created',
      receipt_no: receipt,
    });
    if (error) console.error('[checkout] payment insert failed', error);
  }

  return NextResponse.json({
    receipt,
    sessionId: session.id,
    redirectUrl: session.redirectUrl,
    clientToken: session.clientToken,
    simulated: session.simulated,
    provider: provider.name,
  });
}
