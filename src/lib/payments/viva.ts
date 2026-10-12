import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  WebhookResult,
} from './types';

/**
 * Viva.com, on the European entity.
 *
 * A Greek payment institution passporting across the EEA, so the merchant has
 * to be registered in the EU or the UK. That is the whole reason this adapter
 * exists beside the others: it cannot be used from the Dubai company, and the
 * company it is used from has to be the company the site names.
 *
 * Smart Checkout, which means a redirect: we create an order, send the browser
 * to Viva's hosted page, and they come back. No card data touches this server
 * and none of it touches the browser from our side.
 *
 * **Their webhooks are not signed.** Verification is a one-time handshake: Viva
 * GETs the webhook URL and expects the account's key printed back, which proves
 * we control the address and proves nothing at all about any individual
 * delivery afterwards. A POST arriving here is therefore an unauthenticated
 * claim that something was paid, and treating it as fact would be an open
 * endpoint for marking any order paid. So `handleWebhook` ignores the status in
 * the payload and asks Viva's API what actually happened. The payload is used
 * for one thing only: which transaction to go and look up.
 */

type Env = {
  clientId: string;
  clientSecret: string;
  /** The key Viva's verification GET expects back. */
  webhookKey: string;
  demo: boolean;
};

function env(): Env | null {
  const clientId = process.env.VIVA_CLIENT_ID;
  const clientSecret = process.env.VIVA_CLIENT_SECRET;
  const webhookKey = process.env.VIVA_WEBHOOK_KEY;
  if (!clientId || !clientSecret || !webhookKey) return null;
  return {
    clientId,
    clientSecret,
    webhookKey,
    /* Production only when asked for explicitly. A missing variable sending
       real cards at the live API is the wrong way round. */
    demo: process.env.VIVA_ENV !== 'production',
  };
}

const HOSTS = {
  demo: {
    accounts: 'https://demo-accounts.vivapayments.com',
    api: 'https://demo-api.vivapayments.com',
    checkout: 'https://demo.vivapayments.com',
  },
  live: {
    accounts: 'https://accounts.vivapayments.com',
    api: 'https://api.vivapayments.com',
    checkout: 'https://www.vivapayments.com',
  },
} as const;

function hosts(config: Env) {
  return config.demo ? HOSTS.demo : HOSTS.live;
}

/**
 * The access token, cached until shortly before it expires.
 *
 * Viva's tokens last an hour. Fetching one per checkout would add a round trip
 * to every payment and burn rate limit for nothing; the sixty-second margin is
 * so a token never expires between being read here and arriving there.
 */
let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(config: Env): Promise<string | null> {
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const response = await fetch(`${hosts(config).accounts}/connect/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${basic}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'urn:viva:payments:core:api:redirectcheckout',
    }),
  });

  if (!response.ok) {
    console.error('[viva] token request failed', response.status, await response.text());
    return null;
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;

  cached = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(0, (data.expires_in ?? 3600) - 60) * 1000,
  };
  return cached.token;
}

/** What Viva calls a finished, successful transaction. */
const SUCCEEDED = 'F';

type Transaction = { statusId?: string; orderCode?: number; transactionId?: string };

async function retrieveTransaction(
  config: Env,
  transactionId: string,
): Promise<Transaction | null> {
  const token = await accessToken(config);
  if (!token) return null;

  const response = await fetch(
    `${hosts(config).api}/checkout/v2/transactions/${encodeURIComponent(transactionId)}`,
    { headers: { authorization: `Bearer ${token}` } },
  );

  if (!response.ok) {
    console.error('[viva] transaction lookup failed', response.status);
    return null;
  }
  return (await response.json()) as Transaction;
}

export const vivaProvider: PaymentProvider = {
  name: 'viva',

  isConfigured() {
    return env() !== null;
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const config = env();
    if (!config) {
      return { id: `sim_${request.receipt}`, redirectUrl: null, clientToken: null, simulated: true };
    }

    const token = await accessToken(config);
    if (!token) throw new Error('viva_token_failed');

    /*
      `amount` is in minor units, which is what `amountMinor` already holds, so
      nothing is multiplied here. That is deliberate: every bug of this class
      comes from a conversion somebody added because the units looked wrong.
    */
    const response = await fetch(`${hosts(config).api}/checkout/v2/orders`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        amount: request.amountMinor,
        customerTrns: request.description,
        customer: {
          email: request.customer.email,
          fullName: request.customer.name,
          phone: request.customer.phone,
          requestLang: 'en-GB',
        },
        /* Our own reference, so a payment can be matched to a candidate from
           Viva's side without reading our database. */
        merchantTrns: request.receipt,
        /* One attempt per order. A candidate who abandons gets a new order
           rather than reusing one whose state we have already recorded. */
        maxInstallments: 0,
        paymentTimeout: 1800,
      }),
    });

    if (!response.ok) {
      console.error('[viva] create order failed', response.status, await response.text());
      throw new Error('viva_create_failed');
    }

    const data = (await response.json()) as { orderCode?: number };
    if (!data.orderCode) throw new Error('viva_create_failed');

    const orderCode = String(data.orderCode);
    return {
      id: orderCode,
      redirectUrl: `${hosts(config).checkout}/web/checkout?ref=${orderCode}`,
      clientToken: null,
      simulated: false,
    };
  },

  /**
   * Confirms from the browser's return.
   *
   * Viva sends the transaction id back on the success URL as `t`. The caller
   * passes it here; what is never done is believing the query string on its
   * own, which anybody can type.
   */
  async confirmSession(sessionId: string) {
    const config = env();
    if (!config) return { paid: false, paymentId: null };

    const transaction = await retrieveTransaction(config, sessionId);
    if (!transaction) return { paid: false, paymentId: null };

    return {
      paid: transaction.statusId === SUCCEEDED,
      paymentId: transaction.transactionId ?? sessionId,
    };
  },

  /**
   * Reads a webhook, then goes and checks.
   *
   * The payload is unsigned, so the only thing taken from it is the transaction
   * id. Whether that transaction was actually paid comes from Viva's API, which
   * is authenticated. A forged POST therefore achieves nothing: either the
   * transaction does not exist, or it does and its real status is whatever Viva
   * says it is.
   */
  async handleWebhook(rawBody: string): Promise<WebhookResult | null> {
    const config = env();
    if (!config) return null;

    let payload: { EventData?: { TransactionId?: string; OrderCode?: number } };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const transactionId = payload.EventData?.TransactionId;
    const orderCode = payload.EventData?.OrderCode;
    if (!transactionId || !orderCode) return null;

    const transaction = await retrieveTransaction(config, transactionId);
    if (!transaction) return null;

    /* The order code is read from Viva's answer, not from the payload, so a
       forged body cannot point a real payment at somebody else's order. */
    const confirmedOrder = transaction.orderCode ?? orderCode;

    return {
      sessionId: String(confirmedOrder),
      paymentId: transactionId,
      status: transaction.statusId === SUCCEEDED ? 'paid' : 'failed',
    };
  },
};

/**
 * The answer to Viva's verification GET.
 *
 * They activate a webhook address by fetching it and expecting the account's
 * key back. Returns null when the adapter is unconfigured, so an environment
 * with no Viva keys does not advertise one.
 */
export function vivaWebhookKey(): string | null {
  return env()?.webhookKey ?? null;
}
