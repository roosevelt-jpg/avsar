/**
 * Client-safe Cashfree constants and types.
 *
 * Separate from the adapter because that one imports node:crypto and must never
 * reach a browser bundle.
 */
export const CASHFREE_SDK_SRC = 'https://sdk.cashfree.com/js/v3/cashfree.js';

export type CashfreeCheckoutResult = {
  error?: { message?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
};

export type CashfreeInstance = {
  checkout(options: {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_modal';
  }): Promise<CashfreeCheckoutResult>;
};

type CashfreeFactory = (options: { mode: 'sandbox' | 'production' }) => CashfreeInstance;

/** Loads the SDK once and returns an instance. */
export async function loadCashfree(mode: 'sandbox' | 'production'): Promise<CashfreeInstance> {
  const existing = (window as unknown as { Cashfree?: CashfreeFactory }).Cashfree;
  if (existing) return existing({ mode });

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CASHFREE_SDK_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('cashfree_sdk_failed'));
    document.head.appendChild(script);
  });

  const factory = (window as unknown as { Cashfree?: CashfreeFactory }).Cashfree;
  if (!factory) throw new Error('cashfree_sdk_missing');
  return factory({ mode });
}
