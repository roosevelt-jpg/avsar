/**
 * Payment provider abstraction.
 *
 * Two rails matter for this product and they are not interchangeable:
 *
 *  - Stripe, on the Dubai entity, is the default. It handles cards worldwide
 *    and every employer invoice.
 *  - A domestic Indian rail (Razorpay, Cashfree, PayU) is the only way to offer
 *    UPI, which is how most candidates in India actually pay. It needs either an
 *    Indian entity or a provider holding an RBI PA-CB licence for cross-border
 *    collection on behalf of a foreign entity.
 *
 * Everything above this interface is rail-agnostic, so the second one can be
 * switched on later without touching the sign-up flow.
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
  readonly name: 'stripe' | 'razorpay';
  isConfigured(): boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /** Confirms a session after the browser returns. Never trust the query string. */
  confirmSession(sessionId: string): Promise<{ paid: boolean; paymentId: string | null }>;
  /** Verifies and interprets a webhook. Returns null when the signature is bad. */
  handleWebhook(rawBody: string, signature: string): Promise<WebhookResult | null>;
}
