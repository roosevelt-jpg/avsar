import { timingSafeEqual } from 'node:crypto';
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  WebhookResult,
} from './types';

/**
 * Network International (N-Genius Online), on the UAE company.
 *
 * The owner's chosen acquirer: the merchant account is held by the Dubai
 * entity and settles in AED. Magnati is the other UAE acquirer named; it has no
 * adapter yet because no API documentation or credentials have been supplied.
 *
 * Hosted payment page, which means a redirect: we create an order, send the
 * browser to Network's page, and it comes back to our return URL with `?ref=`
 * appended. No card data touches this server.
 *
 * Cards only. UAE acquirers do not offer UPI, so an Indian candidate pays by
 * debit or credit card as an international transaction. Many Indian debit
 * cards have international e-commerce switched off by default, which is why the
 * checkout copy tells the candidate before they start.
 *
 * Webhooks carry no signature. N-Genius lets the merchant configure one custom
 * header and value on the webhook, which proves the sender knows a shared
 * secret and nothing about the body. So, as with Viva, the payload is only used
 * to learn which order to look up, and what happened to it is read back from
 * the authenticated API.
 */

type Env = {
  apiKey: string;
  outlet: string;
  base: string;
  webhookHeader: string;
  webhookSecret: string;
};

const BASES = {
  sandbox: 'https://api-gateway.sandbox.ngenius-payments.com',
  production: 'https://api-gateway.ngenius-payments.com',
} as const;

function env(): Env | null {
  const apiKey = process.env.NGENIUS_API_KEY;
  const outlet = process.env.NGENIUS_OUTLET_REF;
  const webhookSecret = process.env.NGENIUS_WEBHOOK_SECRET;
  if (!apiKey || !outlet || !webhookSecret) return null;
  return {
    apiKey,
    outlet,
    /* Production only when asked for explicitly. Some regions are served from
       a different gateway host, which NGENIUS_API_BASE overrides. */
    base:
      process.env.NGENIUS_API_BASE ||
      (process.env.NGENIUS_ENV === 'production' ? BASES.production : BASES.sandbox),
    webhookHeader: (process.env.NGENIUS_WEBHOOK_HEADER || 'x-webhook-secret').toLowerCase(),
    webhookSecret,
  };
}

const PAYMENT_MEDIA = 'application/vnd.ni-payment.v2+json';

/**
 * The access token, cached until shortly before it expires.
 *
 * Tokens last five minutes. The thirty-second margin is so a token never
 * expires between being read here and arriving at the gateway.
 */
let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(config: Env): Promise<string | null> {
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  /* The portal issues the API key already base64-encoded, so it goes into the
     Basic header as it is. */
  const response = await fetch(`${config.base}/identity/auth/access-token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${config.apiKey}`,
      'content-type': 'application/vnd.ni-identity.v1+json',
      accept: 'application/vnd.ni-identity.v1+json',
    },
  });

  if (!response.ok) {
    console.error('[ngenius] token request failed', response.status);
    return null;
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;

  cached = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(0, (data.expires_in ?? 300) - 30) * 1000,
  };
  return cached.token;
}

/** Payment states N-Genius uses for money that has actually been taken. */
const SUCCEEDED = new Set(['PURCHASED', 'CAPTURED']);

type Order = {
  reference?: string;
  _embedded?: { payment?: { state?: string; reference?: string }[] };
};

/* Order references are UUIDs. Anything else is not worth a round trip. */
const REFERENCE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function retrieveOrder(config: Env, reference: string): Promise<Order | null> {
  if (!REFERENCE.test(reference)) return null;
  const token = await accessToken(config);
  if (!token) return null;

  const response = await fetch(
    `${config.base}/transactions/outlets/${encodeURIComponent(config.outlet)}/orders/${encodeURIComponent(reference)}`,
    { headers: { authorization: `Bearer ${token}`, accept: PAYMENT_MEDIA } },
  );

  if (!response.ok) {
    console.error('[ngenius] order lookup failed', response.status);
    return null;
  }
  return (await response.json()) as Order;
}

function outcome(order: Order): { paid: boolean; paymentId: string | null } {
  const payments = order._embedded?.payment ?? [];
  const succeeded = payments.find((payment) => SUCCEEDED.has(payment.state ?? ''));
  return { paid: Boolean(succeeded), paymentId: succeeded?.reference ?? null };
}

function sameSecret(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const ngeniusProvider: PaymentProvider = {
  name: 'ngenius',

  isConfigured() {
    return env() !== null;
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const config = env();
    if (!config) {
      return { id: `sim_${request.receipt}`, redirectUrl: null, clientToken: null, simulated: true };
    }

    const token = await accessToken(config);
    if (!token) throw new Error('ngenius_token_failed');

    /* `value` is in minor units (fils for AED), which is what `amountMinor`
       already holds, so nothing is converted here. */
    const response = await fetch(
      `${config.base}/transactions/outlets/${encodeURIComponent(config.outlet)}/orders`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': PAYMENT_MEDIA, accept: PAYMENT_MEDIA },
        body: JSON.stringify({
          action: 'PURCHASE',
          amount: { currencyCode: request.currency, value: request.amountMinor },
          emailAddress: request.customer.email,
          merchantOrderReference: request.receipt,
          merchantAttributes: {
            redirectUrl: request.successUrl,
            cancelUrl: request.cancelUrl,
            cancelText: 'Back to my dashboard',
            skipConfirmationPage: true,
          },
          merchantDefinedData: { receipt: request.receipt },
        }),
      },
    );

    if (!response.ok) {
      console.error('[ngenius] create order failed', response.status);
      throw new Error('ngenius_create_failed');
    }

    const data = (await response.json()) as { reference?: string; _links?: { payment?: { href?: string } } };
    const href = data._links?.payment?.href;
    if (!data.reference || !href) throw new Error('ngenius_create_failed');

    return { id: data.reference, redirectUrl: href, clientToken: null, simulated: false };
  },

  /**
   * Confirms from the browser's return.
   *
   * The return URL carries `ref`, the order reference, which the candidate can
   * edit. It is only a question: the answer, including which order it is,
   * comes back from the API, so pointing it at somebody else's order unlocks
   * nothing for the person asking.
   */
  async confirmSession(reference: string) {
    const config = env();
    if (!config) return { paid: false, paymentId: null };

    const order = await retrieveOrder(config, reference);
    if (!order?.reference) return { paid: false, paymentId: null };

    return { ...outcome(order), orderId: order.reference };
  },

  async handleWebhook(rawBody: string, headers: Headers): Promise<WebhookResult | null> {
    const config = env();
    if (!config) return null;
    if (!sameSecret(headers.get(config.webhookHeader), config.webhookSecret)) return null;

    let payload: { order?: { reference?: unknown } };
    try {
      payload = JSON.parse(rawBody) as typeof payload;
    } catch {
      console.error('[ngenius] webhook body was not JSON');
      return null;
    }

    const reference = typeof payload.order?.reference === 'string' ? payload.order.reference : null;
    if (!reference) {
      console.error('[ngenius] no order reference in webhook');
      return null;
    }

    const order = await retrieveOrder(config, reference);
    if (!order?.reference) return null;

    const { paid, paymentId } = outcome(order);
    /* A webhook for a payment still in progress is not a failure. Only a paid
       order changes anything; recordPayment ignores 'created'. */
    return { sessionId: order.reference, paymentId, status: paid ? 'paid' : 'created' };
  },
};
