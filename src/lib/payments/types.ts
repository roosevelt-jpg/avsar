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
 *  - **Dodo Payments**, a merchant of record, and the rail that exists because
 *    the others refused. It is the seller, not us: it collects rupees in India
 *    under its own licences, carries the tax, and settles euros here. That is
 *    what makes UPI available at all, and it holds only while the candidate is
 *    buying a digital product rather than a job.
 *  - **Viva.com**, a European acquirer. Cheap card rates, and the only one here
 *    that cannot run on the Dubai company: it passports an EU licence and
 *    onboards merchants registered in the EEA or the UK. Using it means the
 *    European entity is the one charging, and therefore the one the site has to
 *    name. It does not do UPI, so India still needs a rail of its own.
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
  readonly name: 'stripe' | 'razorpay' | 'cashfree' | 'eximpe' | 'viva' | 'dodo';
  isConfigured(): boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /**
   * Confirms a payment after the browser returns. Never trust the query string.
   *
   * `orderId` is the provider's own order id **as the provider reports it**,
   * not as the browser presented it. The return URL carries both a transaction
   * and an order, and a candidate can edit either: pairing somebody else's paid
   * transaction with their own order id would otherwise mark their order paid.
   * Reading the order back from the provider's answer closes that, so a caller
   * that uses this field rather than the query string cannot be fooled.
   *
   * Null where a provider does not report one; such a rail simply has no
   * browser-return path and relies on its webhook.
   */
  confirmSession(
    sessionId: string,
  ): Promise<{ paid: boolean; paymentId: string | null; orderId?: string | null }>;
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
