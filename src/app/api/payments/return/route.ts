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
 */
export async function GET(request: Request) {
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
    url.searchParams.get('payment_id') ??
    url.searchParams.get('transaction_id');

  if (!transactionId) return NextResponse.redirect(new URL(dashboard, url.origin));

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
    }
  } catch (error) {
    /*
      Never leave the candidate on an error page over this. They have paid, the
      webhook is still coming, and the dashboard reads the database rather than
      this request's outcome.
    */
    console.error('[payments] return confirmation failed', error);
  }

  return NextResponse.redirect(new URL(dashboard, url.origin));
}
