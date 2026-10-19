import { refreshIntegrations } from '@/lib/integrations/runtime';
import { NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { vivaWebhookKey } from '@/lib/payments/viva';
import { recordPayment } from '@/lib/payments/record';

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
 * Payment webhook. One of the two paths that can mark a payment paid.
 *
 * It catches the candidate who closes the tab before being redirected back, and
 * `/api/payments/return` catches the webhook that never arrives or arrives in a
 * shape this adapter misreads. Either is sufficient on its own, both can fire
 * for one payment, and `recordPayment` is written so that running twice is the
 * ordinary case rather than something to defend against.
 *
 * The raw body is read as text because a signature, where there is one, is
 * computed over the exact bytes the provider sent. Viva does not sign at all,
 * which is why its adapter verifies by asking the API instead.
 */
export async function POST(request: Request) {
  await refreshIntegrations();
  const provider = getPaymentProvider();
  const raw = await request.text();

  /* The whole header set goes to the adapter. Each provider signs differently,
     and the route has no business knowing how. */
  const result = await provider.handleWebhook(raw, request.headers);

  /* Do not say why it was rejected. An attacker probing this learns nothing. */
  if (!result) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await recordPayment({
    orderId: result.sessionId,
    paymentId: result.paymentId,
    status: result.status,
  });

  return NextResponse.json({ received: true });
}
