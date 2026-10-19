import { refreshIntegrations } from '@/lib/integrations/runtime';
import { localePath } from '@/lib/i18n';
import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/cms/data';
import { RAIL_CURRENCIES, priceBreakdown } from '@/lib/company/config';
import { getPaymentProvider, receiptNumber } from '@/lib/payments';
import { paymentMethodSchema } from '@/lib/validation';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getSessionCandidate, type SessionCandidate } from '@/lib/auth';
import { withIdempotency } from '@/lib/security/idempotency';
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
  await refreshIntegrations();
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  if (candidate.paymentStatus === 'paid') {
    return NextResponse.json({ error: 'already_paid' }, { status: 409 });
  }

  /* A double tap on "Pay" over a slow connection must open one order, not two. */
  return withIdempotency(request, 'checkout', candidate.id, () => openCheckout(request, candidate));
}

async function openCheckout(request: Request, candidate: SessionCandidate): Promise<NextResponse> {
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
  const settings = await getSiteSettings();
  const price = priceBreakdown(settings.pricing);
  const COHORT = settings.cohort;

  /* A price of zero is a settings mistake, never a free package. */
  if (price.totalMinor <= 0) {
    console.error('[checkout] refused: no package price for', price.currency);
    return NextResponse.json({ error: 'payment_misconfigured' }, { status: 503 });
  }

  /* A rail that cannot charge the configured currency must not be asked to:
     EximPe would reject euros, and Viva would reject rupees. Refusing here
     turns a silent misconfiguration into one clear log line. */
  if (!(RAIL_CURRENCIES[provider.name] ?? []).includes(price.currency)) {
    console.error(`[checkout] ${provider.name} cannot charge ${price.currency}. Change the charge currency on Settings › Company & pricing.`);
    return NextResponse.json({ error: 'payment_misconfigured' }, { status: 503 });
  }
  const locale = candidate.locale;

  const receipt = receiptNumber(1, Math.floor(Math.random() * 999_999));
  const origin = new URL(request.url).origin;

  let session;
  try {
    session = await provider.createCheckout({
      amountMinor: price.totalMinor,
      currency: price.currency,
      receipt,
      description: `${settings.general.siteName} career package`,
      customer: { name: candidate.fullName, email: candidate.email, phone: '' },
      methodHint: method.data,
      /*
        Through the return handler rather than straight to the dashboard, so the
        payment is confirmed against the provider before the candidate sees the
        page. `{CHECKOUT_SESSION_ID}` used to sit on this URL: that is Stripe's
        placeholder, and every other rail passed it through to the browser
        verbatim. Each provider appends its own identifiers, and the handler
        reads whichever it recognises.
      */
      successUrl: `${origin}/api/payments/return?locale=${locale}&paid=${receipt}`,
      cancelUrl: `${origin}${localePath(locale, '/dashboard?status=cancelled')}`,
      metadata: {
        cohort: COHORT.id,
        tier: 'standard',
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
