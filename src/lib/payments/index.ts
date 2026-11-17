import { ccavenueProvider } from './ccavenue';
import type { PaymentMethodHint, PaymentProvider } from './types';

/**
 * Which rail collects from candidates.
 *
 * CCAvenue UAE is the only gateway exposed in Settings › Integrations. Other
 * adapters remain in the tree for history, but checkout always uses this one.
 */
export function getPaymentProvider(): PaymentProvider {
  return ccavenueProvider;
}

export type {
  PaymentProvider,
  CheckoutRequest,
  CheckoutSession,
  PaymentStatus,
  PaymentMethodHint,
} from './types';

/**
 * UPI and net banking charge INR; card charges AED. Both methods stay on the
 * unlock UI so the candidate can pick — checkout picks the currency from the
 * method, not from Settings › charge currency alone.
 */
const DEFAULT_HINTS: readonly PaymentMethodHint[] = ['upi', 'card', 'netbanking'];

function parseMethodList(raw: string | undefined, fallback: PaymentMethodHint[]): PaymentMethodHint[] {
  const parsed = (raw ?? '')
    .split(',')
    .map((method) => method.trim())
    .filter((method): method is PaymentMethodHint =>
      (DEFAULT_HINTS as readonly string[]).includes(method),
    );
  return parsed.length > 0 ? parsed : fallback;
}

/** Methods shown on the unlock UI. Override with CCAVENUE_METHODS if needed. */
export function availablePaymentMethods(): PaymentMethodHint[] {
  return parseMethodList(process.env.CCAVENUE_METHODS, [...DEFAULT_HINTS]);
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
