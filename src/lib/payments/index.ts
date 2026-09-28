import { stripeProvider } from './stripe';
import { razorpayProvider } from './razorpay';
import type { PaymentMethodHint, PaymentProvider } from './types';

/**
 * Stripe is the default rail. PAYMENT_PROVIDER=razorpay switches the candidate
 * side to the domestic Indian rail when that becomes available.
 */
export function getPaymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === 'razorpay' ? razorpayProvider : stripeProvider;
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
 * UPI and net banking are domestic Indian instruments. They exist on Stripe only
 * for accounts registered in India, so a Dubai Stripe account can offer cards
 * only. Setting PAYMENT_PROVIDER=razorpay unlocks all three.
 */
export function availablePaymentMethods(): PaymentMethodHint[] {
  return getPaymentProvider().name === 'razorpay' ? ['upi', 'card', 'netbanking'] : ['card'];
}

/** Receipt numbers follow the prototype's format: AV-01-048213. */
export function receiptNumber(cohortSequence: number, serial: number): string {
  return `AV-${String(cohortSequence).padStart(2, '0')}-${String(serial).padStart(6, '0')}`;
}
