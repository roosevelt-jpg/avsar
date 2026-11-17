import { createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  WebhookResult,
} from './types';

/**
 * CCAvenue UAE (non-seamless Hosted Payment Page).
 *
 * Built from their NodeJS Integration Kit (UAE). Test and live both post to the
 * same initiate URL; only merchant id / access code / working key change:
 * https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction
 *
 * Flow: encrypt the order fields → browser auto-POSTs encRequest + access_code
 * to that URL → CCAvenue POSTs encResp back to our redirect/cancel URL. The
 * encrypted response is the proof of payment (the kit has no separate status
 * call). UPI, cards and net banking appear on their page when the merchant
 * account has them; we can hint with `payment_option`.
 */

export const CCAVENUE_INITIATE_URL =
  'https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction';

type Env = {
  merchantId: string;
  accessCode: string;
  workingKey: string;
};

function env(): Env | null {
  const merchantId = process.env.CCAVENUE_MERCHANT_ID?.trim() ?? '';
  const accessCode = process.env.CCAVENUE_ACCESS_CODE?.trim() ?? '';
  const workingKey = process.env.CCAVENUE_WORKING_KEY?.trim() ?? '';
  if (!merchantId || !accessCode || !workingKey) return null;
  return { merchantId, accessCode, workingKey };
}

/** Same key derivation as the UAE kit: MD5(working key) → Base64, fixed IV. */
function cryptoKeys(workingKey: string): { keyBase64: string; ivBase64: string } {
  const md5 = createHash('md5').update(workingKey).digest();
  return {
    keyBase64: Buffer.from(md5).toString('base64'),
    ivBase64: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).toString(
      'base64',
    ),
  };
}

function algorithm(keyBase64: string): 'aes-128-cbc' | 'aes-256-cbc' {
  const length = Buffer.from(keyBase64, 'base64').length;
  if (length === 16) return 'aes-128-cbc';
  if (length === 32) return 'aes-256-cbc';
  throw new Error('ccavenue_invalid_key_length');
}

export function encryptCcavenue(plainText: string, workingKey: string): string {
  const { keyBase64, ivBase64 } = cryptoKeys(workingKey);
  const key = Buffer.from(keyBase64, 'base64');
  const iv = Buffer.from(ivBase64, 'base64');
  const cipher = createCipheriv(algorithm(keyBase64), key, iv);
  return cipher.update(plainText, 'utf8', 'hex') + cipher.final('hex');
}

export function decryptCcavenue(encHex: string, workingKey: string): string {
  const { keyBase64, ivBase64 } = cryptoKeys(workingKey);
  const key = Buffer.from(keyBase64, 'base64');
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = createDecipheriv(algorithm(keyBase64), key, iv);
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString(
    'utf8',
  );
}

function toMajor(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

/** Digits-only phone; CCAvenue rejects blank or oddly formatted billing_tel. */
function billingTel(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 8) return digits.slice(0, 20);
  return '0000000000';
}

/**
 * Flatten fields the way the kit does: raw `key=value&…` with no URI encoding.
 * CCAvenue encrypts that exact string; encoding would make the gateway reject it.
 */
function encodeFields(fields: Record<string, string>): string {
  return Object.entries(fields)
    .filter(([, value]) => value.length > 0)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function parseResponse(plain: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of plain.split('&')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    out[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return out;
}

function extractEncResp(rawBody: string): string | null {
  try {
    const params = new URLSearchParams(rawBody);
    const enc = params.get('encResp') ?? params.get('enc_resp');
    if (enc) return enc;
  } catch {
    /* fall through */
  }
  const match = /(?:^|[&?])encResp=([^&]+)/i.exec(rawBody);
  return match?.[1] ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
}

const SUCCESS = new Set(['success', 'successful', 'shipped']);

function outcomeFromResponse(fields: Record<string, string>): {
  paid: boolean;
  failed: boolean;
  orderId: string | null;
  paymentId: string | null;
} {
  const status = (fields.order_status ?? fields.order_status_type ?? '').trim().toLowerCase();
  const orderId = fields.order_id?.trim() || null;
  const paymentId = fields.tracking_id?.trim() || fields.bank_ref_no?.trim() || null;
  return {
    paid: SUCCESS.has(status),
    failed: status === 'failure' || status === 'aborted' || status === 'timeout' || status === 'invalid',
    orderId,
    paymentId,
  };
}

export const ccavenueProvider: PaymentProvider = {
  name: 'ccavenue',

  isConfigured() {
    return env() !== null;
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const config = env();
    if (!config) {
      return { id: `cca_sim_${request.receipt}`, redirectUrl: null, clientToken: null, simulated: true };
    }

    const orderId = request.receipt.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 30) || `SA${Date.now()}`;
    const inIndia = request.currency === 'INR';
    const name = (request.customer.name.trim() || 'Candidate').slice(0, 60);

    /*
      Do not send payment_option. Forcing OPTUPI/OPTCRDC fails with Invalid
      Parameter when that method is not enabled on the outlet; the hosted page
      shows whatever CCAvenue enabled (including UPI when they turn it on).
      Error 31002 is specifically "currency: Invalid Parameter" — UAE test
      accounts are usually AED-only until CCAvenue enables INR.
    */
    const fields: Record<string, string> = {
      merchant_id: config.merchantId,
      order_id: orderId,
      currency: request.currency,
      amount: toMajor(request.amountMinor),
      redirect_url: request.successUrl,
      cancel_url: request.cancelUrl,
      language: 'EN',
      billing_name: name,
      billing_address: inIndia ? 'India' : 'Dubai',
      billing_city: inIndia ? 'Mumbai' : 'Dubai',
      billing_state: inIndia ? 'MH' : 'DU',
      billing_zip: inIndia ? '400001' : '00000',
      billing_country: inIndia ? 'India' : 'United Arab Emirates',
      billing_tel: billingTel(request.customer.phone),
      billing_email: request.customer.email.slice(0, 70),
      delivery_name: name,
      delivery_address: inIndia ? 'India' : 'Dubai',
      delivery_city: inIndia ? 'Mumbai' : 'Dubai',
      delivery_state: inIndia ? 'MH' : 'DU',
      delivery_zip: inIndia ? '400001' : '00000',
      delivery_country: inIndia ? 'India' : 'United Arab Emirates',
      delivery_tel: billingTel(request.customer.phone),
      merchant_param1: request.metadata.candidate_id?.slice(0, 100) ?? '',
      merchant_param2: request.metadata.product?.slice(0, 100) ?? '',
      merchant_param3: request.methodHint,
      customer_identifier: (request.metadata.candidate_id || request.customer.email).slice(0, 70),
    };

    const encRequest = encryptCcavenue(encodeFields(fields), config.workingKey);
    const clientToken = JSON.stringify({
      accessCode: config.accessCode,
      encRequest,
      action: CCAVENUE_INITIATE_URL,
    });

    return { id: orderId, redirectUrl: null, clientToken, simulated: false };
  },

  /**
   * CCAvenue does not give a status API in this kit. Confirmation only works
   * when the encrypted response is present (browser return or S2S webhook).
   * A bare order id in the query string cannot unlock anyone.
   */
  async confirmSession() {
    return { paid: false, paymentId: null, orderId: null };
  },

  async handleWebhook(rawBody: string, _headers: Headers): Promise<WebhookResult | null> {
    void _headers;
    const config = env();
    if (!config) return null;

    const encResp = extractEncResp(rawBody);
    if (!encResp) return null;

    let plain: string;
    try {
      plain = decryptCcavenue(encResp, config.workingKey);
    } catch (error) {
      console.error('[ccavenue] decrypt failed', error);
      return null;
    }

    const fields = parseResponse(plain);
    const { paid, failed, orderId, paymentId } = outcomeFromResponse(fields);
    if (!orderId) {
      console.error('[ccavenue] response had no order_id');
      return null;
    }

    if (paid) return { sessionId: orderId, paymentId, status: 'paid' };
    if (failed) return { sessionId: orderId, paymentId, status: 'failed' };
    return { sessionId: orderId, paymentId, status: 'created' };
  },
};
