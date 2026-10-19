import PaytmChecksum from 'paytmchecksum';
import type { CheckoutRequest, CheckoutSession, PaymentProvider, WebhookResult } from './types';

/**
 * Paytm Payment Gateway (All-in-One / JS Checkout).
 *
 * Indian domestic rail: UPI, cards, wallet and net banking. Needs a Paytm
 * merchant account. Credentials live in Settings › Integrations; switch
 * PAYMENT_PROVIDER=paytm when the account is live.
 *
 * Flow: initiateTransaction → txnToken in the browser → Paytm CheckoutJS →
 * callback/return confirms via getTransactionStatus (never trust the browser).
 */

const MID = () => process.env.PAYTM_MID ?? '';
const KEY = () => process.env.PAYTM_MERCHANT_KEY ?? '';
const WEBSITE = () => process.env.PAYTM_WEBSITE?.trim() || (isProduction() ? 'DEFAULT' : 'WEBSTAGING');

function isProduction(): boolean {
  return (process.env.PAYTM_ENV ?? 'sandbox') === 'production';
}

function host(): string {
  return isProduction() ? 'https://securegw.paytm.in' : 'https://securegw-stage.paytm.in';
}

/** Rupees with two decimals — Paytm rejects paise integers. */
function amountRupees(minor: number): string {
  return (minor / 100).toFixed(2);
}

export const paytmProvider: PaymentProvider = {
  name: 'paytm',

  isConfigured() {
    return MID().length > 0 && KEY().length > 0;
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.isConfigured()) {
      return { id: `paytm_sim_${Date.now().toString(36)}`, redirectUrl: null, clientToken: null, simulated: true };
    }

    const orderId = request.receipt.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 50) || `SA${Date.now()}`;
    const mid = MID();
    const body = {
      requestType: 'Payment',
      mid,
      websiteName: WEBSITE(),
      orderId,
      callbackUrl: request.successUrl.includes('?')
        ? `${request.successUrl}&ORDERID=${encodeURIComponent(orderId)}`
        : `${request.successUrl}?ORDERID=${encodeURIComponent(orderId)}`,
      txnAmount: { value: amountRupees(request.amountMinor), currency: 'INR' },
      userInfo: {
        custId: request.metadata.candidate_id || request.customer.email,
        email: request.customer.email,
        ...(request.customer.phone ? { mobile: request.customer.phone } : {}),
        ...(request.customer.name ? { firstName: request.customer.name } : {}),
      },
    };

    const signature = await PaytmChecksum.generateSignature(JSON.stringify(body), KEY());
    const response = await fetch(`${host()}/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(mid)}&orderId=${encodeURIComponent(orderId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body, head: { signature } }),
    });

    if (!response.ok) {
      throw new Error(`Paytm initiate failed: ${response.status} ${await response.text()}`);
    }

    const payload = (await response.json()) as {
      body?: { resultInfo?: { resultStatus?: string; resultMsg?: string }; txnToken?: string };
    };
    const status = payload.body?.resultInfo?.resultStatus;
    const txnToken = payload.body?.txnToken;
    if (status !== 'S' || !txnToken) {
      throw new Error(`Paytm initiate refused: ${payload.body?.resultInfo?.resultMsg ?? status ?? 'unknown'}`);
    }

    /* Browser opens CheckoutJS with mid + orderId + txnToken + amount. */
    const clientToken = JSON.stringify({
      mid,
      orderId,
      txnToken,
      amount: amountRupees(request.amountMinor),
    });

    return { id: orderId, redirectUrl: null, clientToken, simulated: false };
  },

  async confirmSession(orderId: string) {
    if (!this.isConfigured()) return { paid: true, paymentId: null, orderId };

    const mid = MID();
    const body = { mid, orderId };
    const signature = await PaytmChecksum.generateSignature(JSON.stringify(body), KEY());
    const response = await fetch(`${host()}/v3/order/status`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body, head: { signature } }),
    });
    if (!response.ok) return { paid: false, paymentId: null, orderId };

    const payload = (await response.json()) as {
      body?: { resultInfo?: { resultStatus?: string }; txnId?: string; orderId?: string };
    };
    const resultStatus = payload.body?.resultInfo?.resultStatus;
    const paid = resultStatus === 'TXN_SUCCESS';
    return {
      paid,
      paymentId: payload.body?.txnId ?? null,
      orderId: payload.body?.orderId ?? orderId,
    };
  },

  async handleWebhook(rawBody: string, headers: Headers): Promise<WebhookResult | null> {
    void headers;
    if (!this.isConfigured()) return null;

    /* Paytm posts form fields or JSON; accept both. Signature is CHECKSUMHASH. */
    let params: Record<string, string>;
    try {
      const asJson = JSON.parse(rawBody) as Record<string, unknown>;
      params = Object.fromEntries(Object.entries(asJson).map(([k, v]) => [k, String(v ?? '')]));
    } catch {
      params = Object.fromEntries(new URLSearchParams(rawBody).entries());
    }

    const checksum = params.CHECKSUMHASH ?? params.checksumhash ?? '';
    const orderId = params.ORDERID ?? params.orderId ?? '';
    if (!checksum || !orderId) return null;

    const rest = { ...params };
    delete rest.CHECKSUMHASH;
    delete rest.checksumhash;
    const valid = await PaytmChecksum.verifySignature(rest, KEY(), checksum);
    if (!valid) {
      console.error('[paytm] webhook checksum rejected');
      return null;
    }

    const statusCode = params.STATUS ?? params.status ?? '';
    const status = statusCode === 'TXN_SUCCESS' ? 'paid' : statusCode === 'TXN_FAILURE' ? 'failed' : null;
    if (!status) return null;

    return {
      sessionId: orderId,
      paymentId: params.TXNID ?? params.txnId ?? null,
      status,
    };
  },
};
