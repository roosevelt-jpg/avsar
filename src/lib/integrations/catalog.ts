/**
 * Every third-party service the platform talks to, and the settings each one
 * needs.
 *
 * Safe to import from client components: it holds names and descriptions,
 * never values. A field's `name` is the environment variable the code reads,
 * so a value saved in the console and a value set in the hosting environment
 * are the same thing, and the console one wins.
 */

export type IntegrationField = {
  name: string;
  label: string;
  /** Secret values are never shown again after saving, only their last four characters. */
  secret: boolean;
  hint?: string;
  /** For short fixed choices, e.g. sandbox or production. */
  options?: readonly string[];
};

export type Integration = {
  id: string;
  name: string;
  description: string;
  docs?: string;
  fields: IntegrationField[];
};

export type IntegrationGroup = { group: string; items: Integration[] };

const ENV_CHOICE = ['sandbox', 'production'] as const;

export const INTEGRATIONS: IntegrationGroup[] = [
  {
    group: 'Payments',
    items: [
      {
        id: 'payments',
        name: 'Active payment rail',
        description:
          'Which provider takes the package payment. Only one is live at a time. Set up Stripe, Razorpay and Paytm below in advance; switch this when the merchant account is approved.',
        fields: [
          {
            name: 'PAYMENT_PROVIDER',
            label: 'Provider',
            secret: false,
            options: ['stripe', 'razorpay', 'paytm', 'ngenius', 'eximpe', 'cashfree', 'viva', 'dodo'],
          },
        ],
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description:
          'International cards (and UPI only on an India-registered Stripe account). Create a webhook for checkout.session.completed pointing at /api/payments/webhook.',
        docs: 'https://dashboard.stripe.com/apikeys',
        fields: [
          { name: 'STRIPE_SECRET_KEY', label: 'Secret key', secret: true, hint: 'sk_live_… or sk_test_…' },
          { name: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook signing secret', secret: true, hint: 'whsec_… from the Stripe webhook endpoint' },
          {
            name: 'STRIPE_METHODS',
            label: 'Payment method hints',
            secret: false,
            hint: 'Comma-separated for the unlock UI: card, upi, netbanking. Hosted Checkout still shows what the Stripe account allows.',
          },
        ],
      },
      {
        id: 'razorpay',
        name: 'Razorpay',
        description:
          'UPI, cards and net banking for Indian payers (needs an Indian merchant entity). Also set NEXT_PUBLIC_RAZORPAY_KEY_ID in the hosting environment to the same Key ID, then point the webhook at /api/payments/webhook.',
        docs: 'https://dashboard.razorpay.com/app/keys',
        fields: [
          { name: 'RAZORPAY_KEY_ID', label: 'Key ID', secret: false, hint: 'rzp_live_… or rzp_test_…' },
          { name: 'RAZORPAY_KEY_SECRET', label: 'Key secret', secret: true },
          { name: 'RAZORPAY_WEBHOOK_SECRET', label: 'Webhook secret', secret: true, hint: 'From Razorpay › Webhooks' },
        ],
      },
      {
        id: 'paytm',
        name: 'Paytm',
        description:
          'UPI, cards, Paytm wallet and net banking for Indian payers. Keys come from the Paytm business dashboard (API Keys). Webhook/callback: /api/payments/webhook and the return URL set in the adapter.',
        docs: 'https://dashboard.paytmpayments.com/next/apikeys',
        fields: [
          { name: 'PAYTM_MID', label: 'Merchant ID (MID)', secret: false },
          { name: 'PAYTM_MERCHANT_KEY', label: 'Merchant key', secret: true, hint: '16-character key used for checksums' },
          {
            name: 'PAYTM_WEBSITE',
            label: 'Website name',
            secret: false,
            hint: 'WEBSTAGING for test, DEFAULT (or your assigned website) for production',
          },
          {
            name: 'PAYTM_INDUSTRY_TYPE',
            label: 'Industry type',
            secret: false,
            hint: 'Usually Retail. Leave blank to use Retail.',
          },
          { name: 'PAYTM_ENV', label: 'Environment', secret: false, options: ENV_CHOICE },
        ],
      },
      {
        id: 'ngenius',
        name: 'Network International (N-Genius)',
        description: 'Card payments in AED to the UAE company. Set the webhook in the N-Genius portal to /api/payments/webhook with a custom header carrying the webhook secret.',
        docs: 'https://docs.ngenius-payments.com',
        fields: [
          { name: 'NGENIUS_API_KEY', label: 'API key', secret: true },
          { name: 'NGENIUS_OUTLET_REF', label: 'Outlet reference', secret: false },
          { name: 'NGENIUS_WEBHOOK_SECRET', label: 'Webhook secret', secret: true },
          { name: 'NGENIUS_WEBHOOK_HEADER', label: 'Webhook header name', secret: false, hint: 'Default: x-webhook-secret' },
          { name: 'NGENIUS_ENV', label: 'Environment', secret: false, options: ENV_CHOICE },
        ],
      },
      {
        id: 'eximpe',
        name: 'EximPe',
        description: 'UPI, cards and net banking for Indian payers (cross-border PA-CB).',
        fields: [
          { name: 'EXIMPE_CLIENT_ID', label: 'Client ID', secret: false },
          { name: 'EXIMPE_CLIENT_SECRET', label: 'Client secret', secret: true },
          { name: 'EXIMPE_ENCRYPTION_KEY', label: 'Encryption key', secret: true },
          { name: 'EXIMPE_MERCHANT_ID', label: 'Merchant ID', secret: false },
          { name: 'EXIMPE_ENV', label: 'Environment', secret: false, options: ENV_CHOICE },
        ],
      },
      {
        id: 'cashfree',
        name: 'Cashfree',
        description: 'UPI, cards and net banking for Indian payers (cross-border PA-CB).',
        fields: [
          { name: 'CASHFREE_APP_ID', label: 'App ID', secret: false },
          { name: 'CASHFREE_SECRET_KEY', label: 'Secret key', secret: true },
          { name: 'CASHFREE_WEBHOOK_SECRET', label: 'Webhook secret', secret: true },
          { name: 'CASHFREE_ENV', label: 'Environment', secret: false, options: ENV_CHOICE },
        ],
      },
      {
        id: 'viva',
        name: 'Viva Wallet',
        description: 'Cards, for a European merchant account.',
        fields: [
          { name: 'VIVA_CLIENT_ID', label: 'Client ID', secret: false },
          { name: 'VIVA_CLIENT_SECRET', label: 'Client secret', secret: true },
          { name: 'VIVA_WEBHOOK_KEY', label: 'Webhook key', secret: true },
          { name: 'VIVA_ENV', label: 'Environment', secret: false, options: ENV_CHOICE },
        ],
      },
      {
        id: 'dodo',
        name: 'Dodo Payments',
        description: 'Merchant of record for international cards.',
        fields: [
          { name: 'DODO_API_KEY', label: 'API key', secret: true },
          { name: 'DODO_PRODUCT_ID', label: 'Product ID', secret: false },
          { name: 'DODO_WEBHOOK_KEY', label: 'Webhook key', secret: true },
          { name: 'DODO_ENV', label: 'Environment', secret: false, options: ENV_CHOICE },
        ],
      },
    ],
  },
  {
    group: 'Messaging',
    items: [
      {
        id: 'resend',
        name: 'Email (Resend)',
        description: 'Every email the site sends. The sending domain must be verified in Resend first.',
        docs: 'https://resend.com/docs',
        fields: [
          { name: 'RESEND_API_KEY', label: 'API key', secret: true },
          { name: 'EMAIL_FROM', label: 'From address', secret: false, hint: 'e.g. S&A Recruitment <no-reply@recruitment.smithandadams.com>' },
        ],
      },
      {
        id: 'ses',
        name: 'Email (Amazon SES)',
        description: 'Alternative to Resend. Used only when Resend is not set.',
        fields: [
          { name: 'AWS_SES_ACCESS_KEY_ID', label: 'Access key ID', secret: false },
          { name: 'AWS_SES_SECRET_ACCESS_KEY', label: 'Secret access key', secret: true },
          { name: 'AWS_SES_REGION', label: 'Region', secret: false, hint: 'e.g. eu-central-1' },
        ],
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp (Meta Cloud API)',
        description: 'Application updates on WhatsApp for candidates who opted in. Use a System User token, not a personal one.',
        docs: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
        fields: [
          { name: 'WHATSAPP_ACCESS_TOKEN', label: 'Access token', secret: true },
          { name: 'WHATSAPP_PHONE_NUMBER_ID', label: 'Phone number ID', secret: false },
        ],
      },
      {
        id: 'staff-alerts',
        name: 'Staff alerts',
        description: 'Who is emailed about new applications, payments and vacancy requests.',
        fields: [{ name: 'STAFF_ALERT_EMAILS', label: 'Email addresses', secret: false, hint: 'Comma-separated' }],
      },
    ],
  },
  {
    group: 'Services',
    items: [
      {
        id: 'google-places',
        name: 'Google Places',
        description:
          'City and town autocomplete on sign-up and the candidate profile. Uses Places API (New); enable Autocomplete and Place Details, then paste a server key (not a browser key).',
        docs: 'https://developers.google.com/maps/documentation/places/web-service/place-autocomplete',
        fields: [{ name: 'GOOGLE_PLACES_API_KEY', label: 'API key', secret: true, hint: 'Server key with Places API (New) enabled' }],
      },
      {
        id: 'anthropic',
        name: 'AI CV service (Anthropic)',
        description: 'Reads CVs and prepares the professional CV in the package.',
        fields: [
          { name: 'ANTHROPIC_API_KEY', label: 'API key', secret: true },
          { name: 'CV_MODEL', label: 'Model', secret: false, hint: 'Leave blank for the default' },
        ],
      },
      {
        id: 'turnstile',
        name: 'Bot protection (Cloudflare Turnstile)',
        description: 'Stops scripted sign-ups. The site key used in the browser is set in the hosting environment as NEXT_PUBLIC_TURNSTILE_SITE_KEY.',
        fields: [{ name: 'TURNSTILE_SECRET_KEY', label: 'Secret key', secret: true }],
      },
      {
        id: 'upstash',
        name: 'Rate limiting (Upstash Redis)',
        description: 'Throttles repeated attempts at sign-in, apply and contact.',
        fields: [
          { name: 'UPSTASH_REDIS_REST_URL', label: 'REST URL', secret: false },
          { name: 'UPSTASH_REDIS_REST_TOKEN', label: 'REST token', secret: true },
        ],
      },
      {
        id: 'sentry',
        name: 'Error reporting (Sentry)',
        description: 'Server errors are reported here. A change takes effect as servers restart.',
        fields: [{ name: 'SENTRY_DSN', label: 'DSN', secret: true }],
      },
    ],
  },
  {
    group: 'Operations',
    items: [
      {
        id: 'site',
        name: 'Site address and scheduled jobs',
        description: 'The public address used in emails, and the secret Vercel Cron sends with each scheduled run.',
        fields: [
          { name: 'SITE_ORIGIN', label: 'Public address', secret: false, hint: 'e.g. https://recruitment.smithandadams.com' },
          { name: 'CRON_SECRET', label: 'Cron secret', secret: true },
        ],
      },
      {
        id: 'security',
        name: 'Staff sign-in',
        description: 'Require an authenticator-app code for every console page. Enrol everyone at Sign-in security first.',
        fields: [{ name: 'STAFF_REQUIRE_MFA', label: 'Require two-step sign-in', secret: false, options: ['false', 'true'] }],
      },
    ],
  },
];

/**
 * Set only in the hosting environment, shown for status. Either the app needs
 * them before it can reach the database at all, or they are compiled into
 * the browser bundle, or changing them would silently break stored data.
 */
export const ENVIRONMENT_ONLY: { name: string; label: string }[] = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Database URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Database public key' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Database service key' },
  { name: 'INTEGRATIONS_MASTER_KEY', label: 'Key that encrypts the values on this page' },
  { name: 'IDENTITY_HASH_SALT', label: 'Duplicate-detection salt (never change once set)' },
  { name: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', label: 'Turnstile site key (browser)' },
  { name: 'NEXT_PUBLIC_RAZORPAY_KEY_ID', label: 'Razorpay key ID (browser)' },
];

export const MANAGED_FIELDS: IntegrationField[] = INTEGRATIONS.flatMap((g) => g.items.flatMap((i) => i.fields));

export function managedField(name: string): IntegrationField | undefined {
  return MANAGED_FIELDS.find((field) => field.name === name);
}
