import { stripeProvider } from './stripe';
import { razorpayProvider } from './razorpay';
import { cashfreeProvider } from './cashfree';
import type { PaymentMethodHint, PaymentProvider } from './types';

/**
 * Which rail collects from candidates.
 *
 * `cashfree` is the one to use while the company is in Dubai and candidates are
 * in India: it is the only configuration here that offers UPI without an Indian
 * entity. `stripe` is the fallback and handles employer invoices regardless.
 */
export function getPaymentProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    case 'cashfree':
      return cashfreeProvider;
    case 'razorpay':
      return razorpayProvider;
    default:
      return stripeProvider;
  }
}

export type {
  PaymentProvider,
  CheckoutRequest,
  CheckoutSession,
  PaymentStatus,
  PaymentMethodHint,
} from './types';

/**
 * Methods the active rail can charge.
 *
 * On Stripe this depends on the individual account, not on a rule we can state
 * here: what an account may offer follows its country, its activation status
 * and whatever Stripe currently supports, and that last part moves. So it is
 * read from STRIPE_METHODS rather than asserted in code, and the way to find
 * the answer is to create a session with a method and see whether Stripe takes
 * it:
 *
 *   curl https://api.stripe.com/v1/checkout/sessions -u "$STRIPE_SECRET_KEY:" \
 *     -d mode=payment -d success_url=... -d cancel_url=... \
 *     -d "payment_method_types[0]=upi" \
 *     -d "line_items[0][quantity]=1" \
 *     -d "line_items[0][price_data][currency]=inr" ...
 *
 * Cashfree and Razorpay reach the Indian domestic rails by construction, the
 * first from outside India and the second from inside it.
 */
export function availablePaymentMethods(): PaymentMethodHint[] {
  if (getPaymentProvider().name !== 'stripe') return ['upi', 'card', 'netbanking'];

  const configured = (process.env.STRIPE_METHODS ?? 'card')
    .split(',')
    .map((method) => method.trim())
    .filter((method): method is PaymentMethodHint =>
      method === 'upi' || method === 'card' || method === 'netbanking',
    );

  /* Never leave the candidate with no way to pay because of a typo. */
  return configured.length > 0 ? configured : ['card'];
}

/** Receipt numbers follow the prototype's format: AV-01-048213. */
export function receiptNumber(cohortSequence: number, serial: number): string {
  return `AV-${String(cohortSequence).padStart(2, '0')}-${String(serial).padStart(6, '0')}`;
}
