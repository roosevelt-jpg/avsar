import { refreshIntegrations } from '@/lib/integrations/runtime';
import { NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { recordPayment } from '@/lib/payments/record';
import { isLocale, defaultLocale, localePath } from '@/lib/i18n';

export const runtime = 'nodejs';

/**
 * Where the candidate lands after paying. The webhook's second pair of eyes.
 *
 * Until this existed the webhook was the only thing that could mark a payment
 * paid, which made one unverified assumption about a provider's payload shape
 * the difference between a candidate getting their report and a candidate
 * having paid for nothing. Two independent paths, either sufficient: a webhook
 * that never arrives, arrives late, or arrives in a shape the adapter misreads
 * is now survivable, and so is a candidate who closes the tab.
 *
 * Neither path trusts the browser. The transaction id off the query string is
 * only a question to ask the provider, and the answer, including which order it
 * belongs to, comes back over an authenticated connection. Somebody editing the
 * URL changes which transaction gets looked up and nothing else.
 *
 * CCAvenue is different: they POST an encrypted `encResp` body. That ciphertext
 * is the proof (decryptable only with our working key), so the POST handler
 * feeds it to `handleWebhook` rather than inventing a status API the kit does
 * not include.
 */
export async function GET(request: Request) {
  await refreshIntegrations();
  const url = new URL(request.url);
  const requested = url.searchParams.get('locale') ?? '';
  const dashboard = localePath(isLocale(requested) ? requested : defaultLocale, '/dashboard');

  /*
    Viva names it `t`; other rails differ, so the generic spelling is accepted
    too. An absent one is not an error: a candidate can reach this URL by going
    back in their history, and they should simply land on their dashboard.
  */
  const transactionId =
    url.searchParams.get('t') ??
    /* Network International appends the order reference as `ref`. */
    url.searchParams.get('ref') ??
    /* Paytm callback / return uses ORDERID. */
    url.searchParams.get('ORDERID') ??
    url.searchParams.get('orderId') ??
    url.searchParams.get('payment_id') ??
    url.searchParams.get('transaction_id');

  if (!transactionId) return NextResponse.redirect(new URL(dashboard, url.origin));

  let confirmedPaid = false;
  try {
    const result = await getPaymentProvider().confirmSession(transactionId);

    /*
      The order comes from the provider's answer, never from `s` in the URL.
      Both sit in a link the candidate can edit, and taking the order from there
      would let somebody pair a stranger's paid transaction with their own order
      id and unlock themselves.
    */
    if (result.paid && result.orderId) {
      await recordPayment({
        orderId: result.orderId,
        paymentId: result.paymentId,
        status: 'paid',
      });
      confirmedPaid = true;
    }
  } catch (error) {
    /*
      Never leave the candidate on an error page over this. They have paid, the
      webhook is still coming, and the dashboard reads the database rather than
      this request's outcome.
    */
    console.error('[payments] return confirmation failed', error);
  }

  /* ?paid=1 opens on the receipt block; it is not proof of payment by itself. */
  const dest = confirmedPaid ? `${dashboard}?paid=1#receipt` : dashboard;
  return NextResponse.redirect(new URL(dest, url.origin));
}

/**
 * Paytm folds ORDERID into the query. CCAvenue posts encResp — decrypt and
 * record, then send the candidate to the dashboard.
 */
export async function POST(request: Request) {
  await refreshIntegrations();
  const url = new URL(request.url);
  const raw = await request.text().catch(() => '');
  const contentType = request.headers.get('content-type') ?? '';

  if (/encResp=/i.test(raw)) {
    const provider = getPaymentProvider();
    let confirmedPaid = false;
    try {
      const result = await provider.handleWebhook(raw, request.headers);
      if (result?.status === 'paid') {
        await recordPayment({
          orderId: result.sessionId,
          paymentId: result.paymentId,
          status: 'paid',
          methodHint: result.methodHint,
          currency: result.currency,
        });
        confirmedPaid = true;
      } else if (result?.status === 'failed') {
        await recordPayment({
          orderId: result.sessionId,
          paymentId: result.paymentId,
          status: 'failed',
          methodHint: result.methodHint,
          currency: result.currency,
        });
      }
    } catch (error) {
      console.error('[payments] ccavenue return failed', error);
    }

    const requested = url.searchParams.get('locale') ?? '';
    const dashboard = localePath(isLocale(requested) ? requested : defaultLocale, '/dashboard');
    const dest = confirmedPaid ? `${dashboard}?paid=1#receipt` : dashboard;
    return NextResponse.redirect(new URL(dest, url.origin), 303);
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = new URLSearchParams(raw);
    for (const key of ['ORDERID', 'orderId', 'TXNID', 'STATUS', 'locale'] as const) {
      const value = form.get(key);
      if (value) url.searchParams.set(key, value);
    }
  }

  return NextResponse.redirect(url, 303);
}
