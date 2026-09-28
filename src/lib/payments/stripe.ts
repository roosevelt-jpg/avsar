import Stripe from 'stripe';
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  WebhookResult,
} from './types';

/**
 * Stripe adapter, using hosted Checkout.
 *
 * Hosted Checkout rather than the Payment Element because it keeps the whole
 * card path off our origin (smallest PCI surface), handles 3DS and the RBI
 * additional-factor step for Indian cards, and lets Stripe decide which methods
 * to show for the account's country.
 *
 * Note on the Indian candidate rail: UPI and net banking are only available on
 * Stripe accounts registered in India. On a Dubai account, an Indian candidate
 * pays by card as an international transaction, and a meaningful share of Indian
 * debit cards and most RuPay cards will decline. See `docs/payments.md`.
 */

const SECRET = process.env.STRIPE_SECRET_KEY ?? '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

let client: Stripe | null = null;

function stripe(): Stripe {
  if (!client) client = new Stripe(SECRET);
  return client;
}

export const stripeProvider: PaymentProvider = {
  name: 'stripe',

  isConfigured() {
    return SECRET.length > 0;
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.isConfigured()) {
      return { id: `cs_sim_${Date.now().toString(36)}`, redirectUrl: null, simulated: true };
    }

    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      /* `payment_method_types` is deliberately omitted: Checkout then shows the
         methods enabled in the Stripe Dashboard for this account and currency,
         rather than a hardcoded list that goes stale. */
      customer_email: request.customer.email,
      client_reference_id: request.receipt,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: request.currency.toLowerCase(),
            unit_amount: request.amountMinor,
            product_data: { name: request.description },
          },
        },
      ],
      /* GST is already inside `amountMinor`: India's OIDAR regime makes the
         supplier liable for 18% on B2C digital services, and the order summary
         shows it broken out, so Stripe must not add tax on top. */
      metadata: request.metadata,
      payment_intent_data: {
        description: request.description,
        metadata: request.metadata,
      },
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
    });

    return { id: session.id, redirectUrl: session.url, simulated: false };
  },

  async confirmSession(sessionId: string) {
    if (!this.isConfigured()) return { paid: true, paymentId: null };

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const paymentIntent = session.payment_intent;
    return {
      paid: session.payment_status === 'paid',
      paymentId: typeof paymentIntent === 'string' ? paymentIntent : (paymentIntent?.id ?? null),
    };
  },

  async handleWebhook(rawBody: string, signature: string): Promise<WebhookResult | null> {
    if (!WEBHOOK_SECRET) return null;

    let event: Stripe.Event;
    try {
      /* Verified against the exact bytes Stripe sent. Parsing first would break
         the signature. */
      event = stripe().webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
    } catch (error) {
      console.error('[stripe] webhook signature rejected', error);
      return null;
    }

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      const intent = session.payment_intent;
      return {
        sessionId: session.id,
        paymentId: typeof intent === 'string' ? intent : (intent?.id ?? null),
        status: session.payment_status === 'paid' ? 'paid' : 'created',
      };
    }

    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      return { sessionId: session.id, paymentId: null, status: 'failed' };
    }

    return null;
  },
};
