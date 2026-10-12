import { stripeProvider } from './stripe';
import { razorpayProvider } from './razorpay';
import { cashfreeProvider } from './cashfree';
import { eximpeProvider } from './eximpe';
import { vivaProvider } from './viva';
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
    case 'viva':
      return vivaProvider;
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
  const provider = getPaymentProvider().name;

  /*
    Viva is a European acquirer. It has no UPI and no Indian netbanking, and
    offering them would put two choices in front of a candidate that the rail
    cannot charge. Its hosted page decides the rest for itself from what is
    enabled on the account, so one honest hint is enough here.

    This used to say "anything that is not Stripe does all three", which was
    true while every other rail was Indian and stopped being true the moment a
    European one existed.
  */
  if (provider === 'viva') return ['card'];

  if (provider !== 'stripe') return ['upi', 'card', 'netbanking'];

  const configured = (process.env.STRIPE_METHODS ?? 'card')
    .split(',')
    .map((method) => method.trim())
    .filter((method): method is PaymentMethodHint =>
      method === 'upi' || method === 'card' || method === 'netbanking',
    );

  /* Never leave the candidate with no way to pay because of a typo. */
  return configured.length > 0 ? configured : ['card'];
}

/**
 * Receipt numbers: SA-01-048213.
 *
 * The prefix was AV-, from the name the platform had before it was S&A
 * Recruitment. Receipts already issued keep theirs, because a receipt is a
 * record of what was sent to somebody rather than a field to rewrite.
 */
export function receiptNumber(cohortSequence: number, serial: number): string {
  return `SA-${String(cohortSequence).padStart(2, '0')}-${String(serial).padStart(6, '0')}`;
}
