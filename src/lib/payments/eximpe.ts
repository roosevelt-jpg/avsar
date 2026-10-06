import crypto from 'node:crypto';
import type { CheckoutRequest, CheckoutSession, PaymentProvider, WebhookResult } from './types';

/**
 * EximPe, the rail this platform actually collects on.
 *
 * It holds a final RBI PA-CB authorisation for **imports**, which is the leg
 * that matters here: an Indian candidate paying a foreign company is an import
 * from India's side, and only an import-authorised aggregator may take rupees
 * by UPI and settle them abroad. That is what makes the Dubai or Portuguese
 * entity question a commercial one rather than a blocker, and it is why this
 * replaced Cashfree, whose merchant review stalled on the licensed-activity
 * mismatch.
 *
 * Built from their v3 documentation, October 2026. Three details in it are easy
 * to get wrong and expensive to debug, so they are handled explicitly below:
 * the amount is in rupees and not paise, `reference_id` rejects underscores,
 * and `X-API-Version` is mandatory with a 401 that blames your credentials when
 * it is missing.
 */

const CLIENT_ID = process.env.EXIMPE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.EXIMPE_CLIENT_SECRET ?? '';
/** Signs the webhooks. A separate value from the API secret, in Developer settings. */
const ENCRYPTION_KEY = process.env.EXIMPE_ENCRYPTION_KEY ?? '';
/** PSPs only. A merchant on its own credentials leaves it unset. */
const MERCHANT_ID = process.env.EXIMPE_MERCHANT_ID ?? '';

const PRODUCTION = process.env.EXIMPE_ENV === 'production';
const BASE = PRODUCTION ? 'https://api-pacb.eximpe.com' : 'https://api-pacb-uat.eximpe.com';

/** Pinned. Omitting it fails with a 401 that talks about credentials instead. */
const API_VERSION = '3.0.0';

/** A delivery older than this is refused, so a captured one cannot be replayed. */
const WEBHOOK_TOLERANCE_SECONDS = 300;

export const EXIMPE_MODE: 'sandbox' | 'production' = PRODUCTION ? 'production' : 'sandbox';

function headers(): Record<string, string> {
  const out: Record<string, string> = {
    'content-type': 'application/json',
    'X-Client-ID': CLIENT_ID,
    'X-Client-Secret': CLIENT_SECRET,
    'X-API-Version': API_VERSION,
  };
  if (MERCHANT_ID) out['X-Merchant-ID'] = MERCHANT_ID;
  return out;
}

/**
 * Rupees as a decimal string, from our paise.
 *
 * Everything in this codebase holds money in minor units so nothing in the
 * payment path touches a float. EximPe wants major units, so the conversion
 * happens once, here, and not in four call sites.
 */
function toRupees(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

/**
 * `reference_id` takes letters, numbers and hyphens only, up to 50.
 *
 * Our receipts already look like `AV-01-048213`, but this is not the place to
 * rely on that staying true: an underscore slipped into the format later would
 * fail at the provider with a message about the field rather than about us.
 */
function toReference(receipt: string): string {
  return receipt.replace(/[^A-Za-z0-9-]/g, '-').slice(0, 50);
}

/** `credit_card` | `debit_card` | `upi` | `net_banking` | `qr`, or unset. */
function toMop(hint: CheckoutRequest['methodHint']): string | undefined {
  if (hint === 'upi') return 'upi';
  if (hint === 'netbanking') return 'net_banking';
  if (hint === 'card') return 'debit_card';
  return undefined;
}

type CreateOrderResponse = {
  success?: boolean;
  message?: string;
  data?: { session_id?: string; order_id?: string };
  error?: { code?: string; message?: string };
};

type OrderStatusResponse = {
  success?: boolean;
  data?: { order_id?: string; status?: string; status_message?: string };
};

/** Their vocabulary for "the money arrived". */
const PAID = new Set(['payment_successful', 'payment_settled', 'paid', 'success']);
const FAILED = new Set(['payment_failed', 'failed', 'cancelled', 'expired']);

export const eximpeProvider: PaymentProvider = {
  name: 'eximpe',

  isConfigured() {
    return CLIENT_ID.length > 0 && CLIENT_SECRET.length > 0;
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.isConfigured()) {
      return {
        id: `xp_sim_${Date.now().toString(36)}`,
        redirectUrl: null,
        clientToken: null,
        simulated: true,
      };
    }

    const response = await fetch(`${BASE}/pg/orders/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        amount: toRupees(request.amountMinor),
        currency: request.currency,
        reference_id: toReference(request.receipt),
        collection_mode: 'hosted_payment',
        ...(toMop(request.methodHint) ? { mop_type: toMop(request.methodHint) } : {}),
        /* Where the candidate lands whatever the outcome. The page there
           confirms against the provider rather than trusting the query. */
        return_url: request.successUrl,
        business_model: 'B2C',
        buyer: {
          name: request.customer.name,
          email: request.customer.email,
          /* E.164 is required: a bare 10-digit number is refused. Ours are
             already stored with the country code. */
          phone: request.customer.phone,
          address: { city: request.metadata.city ?? 'NA', country: 'IN' },
        },
        product: {
          name: request.description,
          /* `service` rather than `digital_goods`, and it matters: physical
             goods demand an 8-digit HS code, and an assessment has none. */
          type_of_goods: 'service',
        },
        invoice: { number: request.receipt, date: new Date().toISOString().slice(0, 10) },
      }),
    });

    const body = (await response.json().catch(() => null)) as CreateOrderResponse | null;

    if (!response.ok || !body?.data?.session_id || !body.data.order_id) {
      const reason = body?.error?.message ?? body?.message ?? `http ${response.status}`;
      console.error('[eximpe] create order failed', response.status, reason);
      throw new Error(`eximpe_create_failed: ${reason}`);
    }

    return {
      id: body.data.order_id,
      /* Their SDK opens the page from the session; there is no URL to send the
         browser to. The session is good for fifteen minutes. */
      redirectUrl: null,
      clientToken: body.data.session_id,
      simulated: false,
    };
  },

  async confirmSession(sessionId: string): Promise<{ paid: boolean; paymentId: string | null }> {
    if (!this.isConfigured()) return { paid: false, paymentId: null };

    const response = await fetch(`${BASE}/pg/orders/${encodeURIComponent(sessionId)}/status/`, {
      headers: headers(),
    });

    const body = (await response.json().catch(() => null)) as OrderStatusResponse | null;
    const status = body?.data?.status ?? '';

    if (!response.ok) {
      console.error('[eximpe] status check failed', response.status, status);
      return { paid: false, paymentId: null };
    }

    return { paid: PAID.has(status), paymentId: body?.data?.order_id ?? null };
  },

  /**
   * Verifies a webhook.
   *
   * V2 is preferred and tried first: it signs a timestamp alongside the body,
   * so a delivery captured off the wire cannot be replayed an hour later. V1 is
   * accepted as a fallback because EximPe still sends both, but it signs only
   * the body and therefore proves authenticity without proving freshness.
   */
  async handleWebhook(rawBody: string, requestHeaders: Headers): Promise<WebhookResult | null> {
    if (!ENCRYPTION_KEY) {
      console.error('[eximpe] EXIMPE_ENCRYPTION_KEY is not set; refusing the webhook');
      return null;
    }

    if (!verify(rawBody, requestHeaders)) return null;

    let payload: {
      event?: string;
      data?: {
        order_id?: string;
        reference_id?: string;
        payment_id?: string;
        status?: string;
      };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const data = payload.data ?? {};
    const sessionId = data.order_id ?? data.reference_id;
    if (!sessionId) return null;

    const event = (payload.event ?? '').toLowerCase();
    const status = (data.status ?? '').toLowerCase();

    const paid = event.includes('payment_successful') || event.includes('payment_settled') || PAID.has(status);
    const failed = event.includes('payment_failed') || FAILED.has(status);

    return {
      sessionId,
      paymentId: data.payment_id ?? null,
      status: paid ? 'paid' : failed ? 'failed' : 'created',
    };
  },
};

function timingSafeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function hmac(material: string): string {
  return crypto.createHmac('sha256', ENCRYPTION_KEY).update(material).digest('hex');
}

function verify(rawBody: string, requestHeaders: Headers): boolean {
  const v2 = requestHeaders.get('x-webhook-signature-v2');

  if (v2) {
    /* `t=<unix>,v2=<hex>` */
    const parts = Object.fromEntries(
      v2.split(',').map((piece) => {
        const at = piece.indexOf('=');
        return [piece.slice(0, at).trim(), piece.slice(at + 1).trim()];
      }),
    );
    const timestamp = Number(parts.t);
    const signature = parts.v2;
    if (!Number.isFinite(timestamp) || !signature) return false;

    const age = Math.abs(Date.now() / 1000 - timestamp);
    if (age > WEBHOOK_TOLERANCE_SECONDS) {
      console.error('[eximpe] webhook rejected: timestamp outside tolerance', age);
      return false;
    }

    if (timingSafeEqualHex(hmac(`${parts.t}.${rawBody}`), signature)) return true;
    console.error('[eximpe] webhook rejected: v2 signature mismatch');
    return false;
  }

  const v1 = requestHeaders.get('x-webhook-signature');
  if (!v1) {
    console.error('[eximpe] webhook rejected: no signature header');
    return false;
  }

  if (timingSafeEqualHex(hmac(rawBody), v1)) return true;
  console.error('[eximpe] webhook rejected: v1 signature mismatch');
  return false;
}
