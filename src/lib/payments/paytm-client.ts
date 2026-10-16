/**
 * Client-safe Paytm CheckoutJS loader.
 *
 * Kept separate from the adapter so `paytmchecksum` and Node crypto never
 * reach a browser bundle.
 */

export type PaytmCheckoutPayload = {
  mid: string;
  orderId: string;
  txnToken: string;
  amount: string;
};

type PaytmCheckoutJS = {
  init(config: Record<string, unknown>): Promise<void>;
  invoke(): void;
};

function scriptSrc(mid: string, mode: 'sandbox' | 'production'): string {
  const host = mode === 'production' ? 'https://securegw.paytm.in' : 'https://securegw-stage.paytm.in';
  return `${host}/merchantpgpui/checkoutjs/merchants/${encodeURIComponent(mid)}.js`;
}

/** Parse the opaque clientToken from checkout. */
export function parsePaytmClientToken(token: string): PaytmCheckoutPayload | null {
  try {
    const data = JSON.parse(token) as Partial<PaytmCheckoutPayload>;
    if (!data.mid || !data.orderId || !data.txnToken || !data.amount) return null;
    return { mid: data.mid, orderId: data.orderId, txnToken: data.txnToken, amount: data.amount };
  } catch {
    return null;
  }
}

/** Loads merchant CheckoutJS and opens the Paytm payment sheet. */
export async function openPaytmCheckout(
  payload: PaytmCheckoutPayload,
  mode: 'sandbox' | 'production',
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-paytm-mid="${payload.mid}"]`);
    if (existing && (window as unknown as { Paytm?: { CheckoutJS?: PaytmCheckoutJS } }).Paytm?.CheckoutJS) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = scriptSrc(payload.mid, mode);
    script.async = true;
    script.dataset.paytmMid = payload.mid;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('paytm_sdk_failed'));
    document.head.appendChild(script);
  });

  const checkout = (window as unknown as { Paytm?: { CheckoutJS?: PaytmCheckoutJS } }).Paytm?.CheckoutJS;
  if (!checkout) throw new Error('paytm_sdk_missing');

  await checkout.init({
    root: '',
    flow: 'DEFAULT',
    data: {
      orderId: payload.orderId,
      token: payload.txnToken,
      tokenType: 'TXN_TOKEN',
      amount: payload.amount,
    },
    handler: {
      notifyMerchant() {
        /* Paytm calls this for sheet lifecycle; payment result lands on callbackUrl. */
      },
    },
  });
  checkout.invoke();
}
