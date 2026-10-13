import crypto from 'node:crypto';
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  WebhookResult,
} from './types';

/**
 * Dodo Payments, as a merchant of record.
 *
 * This is the rail that exists because the others refused. Cashfree's merchant
 * review stalled on the licensed-activity mismatch and EximPe declined
 * outright, and both are RBI-supervised aggregators reading the same category:
 * an Indian consumer paying a foreign company for something attached to a job
 * abroad. A third aggregator would read it the same way.
 *
 * A merchant of record sidesteps that by being the seller. The candidate buys
 * from Dodo, not from Benefit Discovery; Dodo collects the rupees in India
 * under its own licences, carries the tax, and settles euros to the Portuguese
 * account. That also makes UPI available, which no European acquirer can offer
 * and which is how this audience actually pays.
 *
 * The condition is what is being sold. Merchants of record sell digital
 * products and exclude employment services in their terms, so this only works
 * while the candidate is buying an assessment, a report, a rewritten CV and a
 * talent-pool listing. The placement fee moved to the employer for exactly this
 * reason; putting it back would cost the account.
 *
 * Built from their documentation, October 2026. Two things in it are worth
 * knowing before reading further: the price lives in Dodo's product catalogue
 * rather than in this request, and the webhooks follow the Standard Webhooks
 * specification rather than a scheme of their own.
 */

type Env = {
  apiKey: string;
  webhookKey: string;
  /** The catalogue product the candidate is buying. */
  productId: string;
  live: boolean;
};

function env(): Env | null {
  const apiKey = process.env.DODO_API_KEY;
  const webhookKey = process.env.DODO_WEBHOOK_KEY;
  const productId = process.env.DODO_PRODUCT_ID;
  if (!apiKey || !webhookKey || !productId) return null;
  return {
    apiKey,
    webhookKey,
    productId,
    /* Test unless production is asked for by name. The wrong way round is real
       cards against the live API because a variable was never set. */
    live: process.env.DODO_ENV === 'production',
  };
}

function base(config: Env): string {
  return config.live ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
}

/** What Dodo calls a payment that went through. */
const SUCCEEDED = 'succeeded';

type Payment = { payment_id?: string; status?: string; metadata?: Record<string, string> };

async function retrievePayment(config: Env, paymentId: string): Promise<Payment | null> {
  const response = await fetch(
    `${base(config)}/payments/${encodeURIComponent(paymentId)}`,
    { headers: { authorization: `Bearer ${config.apiKey}` } },
  );
  if (!response.ok) {
    console.error('[dodo] payment lookup failed', response.status);
    return null;
  }
  return (await response.json()) as Payment;
}

/**
 * Finds the payment id wherever a given delivery carries it.
 *
 * Their documented envelope is `{type, data: {...}}` and the id sits inside
 * `data`, but the field list under it varies by event type and the docs do not
 * spell out the payment case. Searching a couple of levels for a key named
 * payment_id costs nothing and is the difference between a webhook that works
 * and one that returns 401 with no trace, which is a lesson this codebase
 * learned on the Viva rail rather than in theory.
 */
function findPaymentId(payload: unknown, depth = 0): string | null {
  if (depth > 3 || payload === null || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string' && /^payment_?id$/i.test(key) && value.length > 0) {
      return value;
    }
  }
  for (const value of Object.values(record)) {
    const found = findPaymentId(value, depth + 1);
    if (found) return found;
  }
  return null;
}

/**
 * Standard Webhooks verification. Theirs are signed, unlike Viva's.
 *
 * Signed content is `{id}.{timestamp}.{body}`, the key is the secret with its
 * `whsec_` prefix removed and base64-decoded, and the header holds one or more
 * space-separated `v1,<signature>` entries. Compared in constant time, and the
 * timestamp is checked so a captured delivery cannot be replayed later.
 */
const REPLAY_TOLERANCE_SECONDS = 5 * 60;

function verify(rawBody: string, headers: Headers, secret: string): boolean {
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) return false;

  const sent = Number(timestamp);
  if (!Number.isFinite(sent)) return false;
  if (Math.abs(Date.now() / 1000 - sent) > REPLAY_TOLERANCE_SECONDS) {
    console.error('[dodo] webhook timestamp outside tolerance');
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = crypto
    .createHmac('sha256', key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest('base64');
  const expectedBuffer = Buffer.from(expected);

  /* The header may carry several, for key rotation. Any valid one is enough. */
  return signatureHeader.split(' ').some((entry) => {
    const [version, signature] = entry.split(',');
    if (version !== 'v1' || !signature) return false;
    const candidate = Buffer.from(signature);
    return (
      candidate.length === expectedBuffer.length &&
      crypto.timingSafeEqual(candidate, expectedBuffer)
    );
  });
}

export const dodoProvider: PaymentProvider = {
  name: 'dodo',

  isConfigured() {
    return env() !== null;
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const config = env();
    if (!config) {
      return { id: `sim_${request.receipt}`, redirectUrl: null, clientToken: null, simulated: true };
    }

    /*
      The price is Dodo's, not ours.

      `amount` is only honoured on a product configured as pay-what-you-want;
      on an ordinary product Dodo ignores it and charges the catalogue price. It
      is sent regardless, because on a pay-what-you-want product that keeps
      ASSESSMENT_FEE the single source of truth, which is the premise the rest
      of this codebase is built on.

      If the product is NOT pay-what-you-want, nothing here can detect a
      disagreement: the site would quote one figure and Dodo would take another,
      silently. Configure the product as pay-what-you-want, or keep the two in
      agreement by hand and treat a price change as a two-place change.
    */
    const response = await fetch(`${base(config)}/checkouts`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [
          { product_id: config.productId, quantity: 1, amount: request.amountMinor },
        ],
        customer: {
          email: request.customer.email,
          name: request.customer.name,
          phone_number: request.customer.phone,
        },
        return_url: request.successUrl,
        /* Our receipt, so a payment can be matched to a candidate from Dodo's
           side without reading our database. */
        metadata: { ...request.metadata, receipt: request.receipt },
      }),
    });

    if (!response.ok) {
      console.error('[dodo] create checkout failed', response.status, await response.text());
      throw new Error('dodo_create_failed');
    }

    const data = (await response.json()) as { session_id?: string; checkout_url?: string };
    if (!data.session_id || !data.checkout_url) throw new Error('dodo_create_failed');

    return {
      id: data.session_id,
      redirectUrl: data.checkout_url,
      clientToken: null,
      simulated: false,
    };
  },

  /**
   * Confirms from the browser's return.
   *
   * Takes the payment id off the return URL and asks Dodo what happened. The
   * order id reported back is our own receipt out of the metadata we set, read
   * from Dodo's answer rather than from the query string, so a candidate
   * editing the link cannot attach somebody else's paid payment to their row.
   */
  async confirmSession(paymentId: string) {
    const config = env();
    if (!config) return { paid: false, paymentId: null, orderId: null };

    const payment = await retrievePayment(config, paymentId);
    if (!payment) return { paid: false, paymentId: null, orderId: null };

    return {
      paid: payment.status === SUCCEEDED,
      paymentId: payment.payment_id ?? paymentId,
      orderId: payment.metadata?.receipt ?? null,
    };
  },

  /**
   * Verifies the signature, then asks the API anyway.
   *
   * The signature is real and checked, so unlike the Viva rail this body could
   * reasonably be trusted. It is not: the status is read back from the API, so
   * a stale or out-of-order delivery cannot move a payment backwards, and one
   * code path decides what "paid" means for both routes into `recordPayment`.
   */
  async handleWebhook(rawBody: string, headers: Headers): Promise<WebhookResult | null> {
    const config = env();
    if (!config) return null;
    if (!verify(rawBody, headers, config.webhookKey)) return null;

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('[dodo] webhook body was not JSON');
      return null;
    }

    const paymentId = findPaymentId(payload);
    if (!paymentId) {
      /* Keys only: the body carries the payer's name and email. */
      console.error(
        '[dodo] no payment id in webhook; keys were',
        payload && typeof payload === 'object'
          ? Object.keys(payload as object).join(',')
          : typeof payload,
      );
      return null;
    }

    const payment = await retrievePayment(config, paymentId);
    const receipt = payment?.metadata?.receipt;
    if (!payment || !receipt) return null;

    return {
      sessionId: receipt,
      paymentId: payment.payment_id ?? paymentId,
      status: payment.status === SUCCEEDED ? 'paid' : 'failed',
    };
  },
};
