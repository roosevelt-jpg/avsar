import { stripeProvider } from './stripe';
import { razorpayProvider } from './razorpay';
import { cashfreeProvider } from './cashfree';
import { eximpeProvider } from './eximpe';
import type { PaymentMethodHint, PaymentProvider } from './types';

/**
 * Which rail collects from candidates.
 *
 * `eximpe` is the live one: an RBI PA-CB import authorisation is what lets it
 * take rupees by UPI from candidates in India and settle them to the company
 * abroad, without an Indian entity. `stripe` remains the fallback and handles
 * employer invoices in euros regardless of which rail collects the fee.
 */
export function getPaymentProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    case 'eximpe':
      return eximpeProvider;
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
 * EximPe and Cashfree reach the Indian domestic rails from outside India, on a
 * PA-CB authorisation; Razorpay reaches them from inside it. All three offer
 * UPI by construction, so there is nothing to configure.
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
