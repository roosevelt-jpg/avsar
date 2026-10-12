import { NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { vivaWebhookKey } from '@/lib/payments/viva';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * Viva activates a webhook address by fetching it.
 *
 * They GET the URL and expect the account's key printed back. It proves we
 * control the address, which is all it proves: it is a one-time handshake and
 * not a signature, so nothing downstream may treat a later POST as trusted on
 * the strength of it. See `handleWebhook` in `lib/payments/viva.ts`.
 *
 * 404 rather than an empty 200 when there is no key, so a deployment with no
 * Viva credentials does not look like a Viva endpoint with a broken one.
 */
export async function GET() {
  const key = vivaWebhookKey();
  if (!key) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ Key: key });
}

/**
 * Payment webhook. The source of truth for payment state.
 *
 * The browser's return from Checkout is a convenience; a candidate who closes
 * the tab still gets their payment recorded here. The raw body is read as text
 * because the signature is computed over the exact bytes the provider sent.
 */
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  const raw = await request.text();

  /* The whole header set goes to the adapter. Each provider signs differently,
     and the route has no business knowing how. */
  const result = await provider.handleWebhook(raw, request.headers);

  /* Do not say why it was rejected. An attacker probing this learns nothing. */
  if (!result) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = getAdminSupabase();
  if (!supabase) return NextResponse.json({ received: true });

  const { error } = await supabase
    .from('payments')
    .update({
      provider_payment_id: result.paymentId,
      status: result.status,
      paid_at: result.status === 'paid' ? new Date().toISOString() : null,
    })
    .eq('provider_order_id', result.sessionId);

  if (error) console.error('[webhook] payment update failed', error);

  if (result.status === 'paid') {
    const { data: payment } = await supabase
      .from('payments')
      .select('candidate_id')
      .eq('provider_order_id', result.sessionId)
      .maybeSingle();

    if (payment?.candidate_id) {
      await supabase
        .from('candidates')
        .update({ payment_status: 'paid' })
        .eq('id', payment.candidate_id);
    }
  }

  return NextResponse.json({ received: true });
}
