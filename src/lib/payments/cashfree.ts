import crypto from 'node:crypto';
import type { CheckoutRequest, CheckoutSession, PaymentProvider, WebhookResult } from './types';

/**
 * Cashfree, as a cross-border payment aggregator.
 *
 * This is the rail that gives candidates UPI. Cashfree holds an RBI PA-CB
 * licence, which is what lets it collect rupees from Indian consumers and
 * settle to a foreign entity: the Dubai company keeps the money and the
 * candidate pays the way they actually pay. A Stripe account registered in the
 * UAE cannot do this, and no configuration changes that.
 *
 * Swapping to Razorpay's PA-CB later is a second file behind this same
 * interface, not a rewrite.
 *
 * Verify the API version and the exact field names against Cashfree's current
 * documentation when the account is opened. The shapes below follow their
 * Payment Gateway order API, and their versioned header means a mismatch fails
 * loudly rather than silently.
 */

const APP_ID = process.env.CASHFREE_APP_ID ?? '';
const SECRET = process.env.CASHFREE_SECRET_KEY ?? '';
const WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET ?? SECRET;

/** Pinned. An unpinned version means their next release changes our behaviour. */
const API_VERSION = '2023-08-01';

const BASE =
  process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

function headers() {
  return {
    'content-type': 'application/json',
    'x-api-version': API_VERSION,
    'x-client-id': APP_ID,
    'x-client-secret': SECRET,
  };
}

type CashfreeOrder = {
  order_id: string;
  payment_session_id: string;
  order_status: string;
};

export const cashfreeProvider: PaymentProvider = {
  name: 'cashfree',

  isConfigured() {
    return APP_ID.length > 0 && SECRET.length > 0;
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.isConfigured()) {
      return {
        id: `cf_sim_${Date.now().toString(36)}`,
        redirectUrl: null,
        clientToken: null,
        simulated: true,
      };
    }

    /* Cashfree works in rupees, not paise, unlike Stripe and Razorpay. Getting
       this wrong charges a hundred times too much or too little, so the
       conversion is explicit rather than inline. */
    const amountInRupees = request.amountMinor / 100;

    const response = await fetch(`${BASE}/orders`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        order_id: request.receipt,
        order_amount: amountInRupees,
        order_currency: request.currency,
        customer_details: {
          /* Their id, not ours: it has to be stable per person and safe to put
             in a request, so the receipt-scoped id is wrong here. */
          customer_id: request.metadata.candidate_id ?? request.receipt,
          customer_name: request.customer.name,
          customer_email: request.customer.email,
          customer_phone: request.customer.phone.replace(/^\+91/, ''),
        },
        order_meta: {
          return_url: `${request.successUrl}&cf_order={order_id}`,
          notify_url: request.metadata.webhook_url,
        },
        order_note: request.description,
        order_tags: request.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cashfree order failed: ${response.status} ${await response.text()}`);
    }

    const order = (await response.json()) as CashfreeOrder;

    /**
     * Cashfree opens its own checkout from the browser with this session id,
     * rather than handing back a URL to redirect to. That is why
     * `clientToken` exists on the interface.
     */
    return {
      id: order.order_id,
      redirectUrl: null,
      clientToken: order.payment_session_id,
      simulated: false,
    };
  },

  async confirmSession(orderId: string) {
    if (!this.isConfigured()) return { paid: true, paymentId: null };

    const response = await fetch(`${BASE}/orders/${orderId}/payments`, { headers: headers() });
    if (!response.ok) return { paid: false, paymentId: null };

    const payments = (await response.json()) as {
      cf_payment_id?: string | number;
      payment_status?: string;
    }[];

    const success = payments.find((payment) => payment.payment_status === 'SUCCESS');
    return {
      paid: Boolean(success),
      paymentId: success?.cf_payment_id ? String(success.cf_payment_id) : null,
    };
  },

  async handleWebhook(rawBody: string, requestHeaders: Headers): Promise<WebhookResult | null> {
    if (!WEBHOOK_SECRET) return null;

    const signature = requestHeaders.get('x-webhook-signature') ?? '';
    const timestamp = requestHeaders.get('x-webhook-timestamp') ?? '';
    if (!signature || !timestamp) return null;

    /* Cashfree signs the timestamp concatenated with the raw body, base64. The
       timestamp is part of the signed material, so it cannot be replayed with a
       fresh one. */
    const expected = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(timestamp + rawBody)
      .digest('base64');

    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    /* Reject anything older than five minutes. A valid signature stays valid
       for ever otherwise, and a captured webhook could be replayed later. */
    const sentAt = Number(timestamp) * 1000;
    if (!Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > 5 * 60 * 1000) {
      console.error('[cashfree] webhook timestamp outside tolerance');
      return null;
    }

    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: {
        order?: { order_id?: string };
        payment?: { cf_payment_id?: string | number; payment_status?: string };
      };
    };

    const orderId = event.data?.order?.order_id;
    if (!orderId) return null;

    const paymentId = event.data?.payment?.cf_payment_id;

    const status =
      event.type === 'PAYMENT_SUCCESS_WEBHOOK'
        ? 'paid'
        : event.type === 'PAYMENT_FAILED_WEBHOOK'
          ? 'failed'
          : null;

    if (!status) return null;

    return {
      sessionId: orderId,
      paymentId: paymentId ? String(paymentId) : null,
      status,
    };
  },
};

/** Cashfree's browser SDK, loaded only when this rail is active. */
export const CASHFREE_SDK_SRC = 'https://sdk.cashfree.com/js/v3/cashfree.js';
export const CASHFREE_MODE = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
