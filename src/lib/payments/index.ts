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
 * UPI and net banking are domestic Indian instruments. On Stripe they exist
 * only for accounts registered in India, so a Dubai Stripe account offers cards
 * alone. Cashfree and Razorpay both reach the domestic rails, the first from
 * outside India and the second from inside it.
 */
export function availablePaymentMethods(): PaymentMethodHint[] {
  const name = getPaymentProvider().name;
  return name === 'stripe' ? ['card'] : ['upi', 'card', 'netbanking'];
}

/** Receipt numbers follow the prototype's format: AV-01-048213. */
export function receiptNumber(cohortSequence: number, serial: number): string {
  return `AV-${String(cohortSequence).padStart(2, '0')}-${String(serial).padStart(6, '0')}`;
}
