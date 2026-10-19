/**
 * Client-safe Razorpay Checkout loader.
 *
 * The Key ID must be available in the browser as NEXT_PUBLIC_RAZORPAY_KEY_ID
 * (same value as RAZORPAY_KEY_ID). The order id is the server-issued clientToken.
 */

export const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

type RazorpayInstance = {
  open(): void;
  on(event: string, handler: (response: unknown) => void): void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

export async function openRazorpayCheckout(options: {
  orderId: string;
  name: string;
  description: string;
  prefillEmail?: string;
}): Promise<void> {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '';
  if (!key) throw new Error('razorpay_public_key_missing');

  await new Promise<void>((resolve, reject) => {
    if ((window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('razorpay_sdk_failed'));
    document.head.appendChild(script);
  });

  const Razorpay = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  if (!Razorpay) throw new Error('razorpay_sdk_missing');

  await new Promise<void>((resolve, reject) => {
    const checkout = new Razorpay({
      key,
      order_id: options.orderId,
      name: options.name,
      description: options.description,
      prefill: { email: options.prefillEmail },
      handler() {
        /* Capture is confirmed by webhook / return; reload picks up paid status. */
        window.location.reload();
        resolve();
      },
      modal: {
        ondismiss() {
          reject(new Error('razorpay_dismissed'));
        },
      },
    });
    checkout.open();
  });
}
