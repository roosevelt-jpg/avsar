import crypto from 'node:crypto';
import type { CheckoutRequest, CheckoutSession, PaymentProvider, WebhookResult } from './types';

/**
 * Domestic Indian rail, kept behind the same interface as Stripe.
 *
 * This is the only path that gives candidates UPI. Switch it on by setting
 * PAYMENT_PROVIDER=razorpay once either an Indian entity exists, or the account
 * is opened with a provider holding an RBI PA-CB licence that can collect INR on
 * behalf of the Dubai entity.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

export const razorpayProvider: PaymentProvider = {
  name: 'razorpay',

  isConfigured() {
    return KEY_ID.length > 0 && KEY_SECRET.length > 0;
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.isConfigured()) {
      return { id: `order_sim_${Date.now().toString(36)}`, redirectUrl: null, simulated: true };
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: request.amountMinor,
        currency: request.currency,
        receipt: request.receipt,
        notes: request.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Razorpay order failed: ${response.status} ${await response.text()}`);
    }

    const order = (await response.json()) as { id: string };
    /* Razorpay uses an in-page widget, so there is nowhere to redirect. The
       client opens Checkout with this order id. */
    return { id: order.id, redirectUrl: null, simulated: false };
  },

  async confirmSession(orderId: string) {
    if (!this.isConfigured()) return { paid: true, paymentId: null };

    const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
      headers: {
        authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`,
      },
    });
    if (!response.ok) return { paid: false, paymentId: null };

    const body = (await response.json()) as { items?: { id: string; status: string }[] };
    const captured = body.items?.find((item) => item.status === 'captured');
    return { paid: !!captured, paymentId: captured?.id ?? null };
  },

  async handleWebhook(rawBody: string, signature: string): Promise<WebhookResult | null> {
    if (!WEBHOOK_SECRET) return null;

    const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
    };
    const entity = event.payload?.payment?.entity;
    if (!entity?.order_id) return null;

    const status =
      event.event === 'payment.captured' ? 'paid' : event.event === 'payment.failed' ? 'failed' : null;
    if (!status) return null;

    return { sessionId: entity.order_id, paymentId: entity.id ?? null, status };
  },
};

/** Client-side Razorpay Checkout script, only needed when that rail is active. */
export const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
export const RAZORPAY_PUBLIC_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '';
