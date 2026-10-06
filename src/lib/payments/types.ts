/**
 * Payment provider abstraction.
 *
 * Four adapters, for two different jobs:
 *
 *  - **EximPe**, the rail this platform collects on. Holds a final RBI PA-CB
 *    authorisation for imports, which is the leg that matters: an Indian
 *    candidate paying a foreign company is an import from India's side, and
 *    only an import-authorised aggregator may take rupees by UPI and settle
 *    them abroad, with no Indian entity required.
 *
 *  - **Stripe**, on the Dubai entity. Cards worldwide, and every employer
 *    invoice in euros. Cannot do UPI: that is only available on Stripe accounts
 *    registered in India, and no configuration changes it.
 *  - **Cashfree**, as a cross-border aggregator. Holds an RBI PA-CB licence,
 *    which lets it collect rupees from Indian consumers and settle to a foreign
 *    entity. This is the rail that gives candidates UPI while the company stays
 *    in Dubai.
 *  - **Razorpay**, as a domestic Indian rail. Cheapest of the three, and needs
 *    an Indian entity. Worth switching to if one exists anyway for the
 *    Emigration Act recruiting-agent registration.
 *
 * Everything above this interface is rail-agnostic, so which one is active is a
 * commercial decision rather than a rewrite.
 */

export type PaymentMethodHint = 'upi' | 'card' | 'netbanking';

export type CheckoutRequest = {
  amountMinor: number;
  currency: 'INR' | 'EUR' | 'AED';
  receipt: string;
  description: string;
  customer: { name: string; email: string; phone: string };
  methodHint: PaymentMethodHint;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
};

export type CheckoutSession = {
  /** Provider's id for the session or order. Stored for reconciliation. */
  id: string;
  /** Where to send the browser. Null when the provider uses an in-page widget. */
  redirectUrl: string | null;
  /**
   * Token the provider's browser SDK needs to open its own checkout.
   * Null for providers that redirect instead.
   */
  clientToken: string | null;
  /** True when no keys are configured and nothing was really created. */
  simulated: boolean;
};

export type PaymentStatus = 'created' | 'paid' | 'failed' | 'simulated';

export type WebhookResult = {
  /** Provider session or order id, matched against `payments.provider_order_id`. */
  sessionId: string;
  paymentId: string | null;
  status: PaymentStatus;
};

export interface PaymentProvider {
  readonly name: 'stripe' | 'razorpay' | 'cashfree' | 'eximpe';
  isConfigured(): boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /** Confirms a session after the browser returns. Never trust the query string. */
  confirmSession(sessionId: string): Promise<{ paid: boolean; paymentId: string | null }>;
  /**
   * Verifies and interprets a webhook. Returns null when the signature is bad.
   *
   * Takes the whole header set rather than one signature string: Stripe signs
   * with one header, Cashfree signs the body concatenated with a timestamp from
   * a second. Passing a single string would have forced the route to know each
   * provider's scheme, which is the thing this interface exists to prevent.
   */
  handleWebhook(rawBody: string, headers: Headers): Promise<WebhookResult | null>;
}
