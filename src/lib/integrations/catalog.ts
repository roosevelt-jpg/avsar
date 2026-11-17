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

export const INTEGRATIONS: IntegrationGroup[] = [
  {
    group: 'Payments',
    items: [
      {
        id: 'ccavenue',
        name: 'CCAvenue UAE',
        description:
          'The only payment gateway on this platform. Hosted Payment Page on secure.ccavenue.ae (same initiate URL for test and live). Checkout charges UPI/net banking in INR and card in AED — both currencies must be enabled on the outlet. Set redirect and cancel URLs in their portal to this site’s /api/payments/return.',
        docs: 'https://www.ccavenue.ae/',
        fields: [
          { name: 'CCAVENUE_MERCHANT_ID', label: 'Merchant ID', secret: false },
          { name: 'CCAVENUE_ACCESS_CODE', label: 'Access code', secret: true },
          { name: 'CCAVENUE_WORKING_KEY', label: 'Working key', secret: true, hint: '32-bit key used to encrypt/decrypt the request and response' },
          {
            name: 'CCAVENUE_METHODS',
            label: 'Checkout method buttons',
            secret: false,
            hint: 'Comma-separated unlock UI: upi, card, netbanking. Leave blank for all three.',
          },
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
        name: 'WhatsApp',
        description:
          'Application updates on WhatsApp for candidates who opted in. Set WHATSAPP_PROVIDER to meta (Cloud API) or green (Green API).',
        docs: 'https://green-api.com/en/docs/',
        fields: [
          {
            name: 'WHATSAPP_PROVIDER',
            label: 'Provider',
            secret: false,
            hint: 'meta (default) or green',
          },
          { name: 'WHATSAPP_ACCESS_TOKEN', label: 'Meta access token', secret: true },
          { name: 'WHATSAPP_PHONE_NUMBER_ID', label: 'Meta phone number ID', secret: false },
          {
            name: 'WHATSAPP_VERIFY_TOKEN',
            label: 'Meta webhook verify token',
            secret: true,
            hint: 'Meta only. Unused when WHATSAPP_PROVIDER=green',
          },
          { name: 'WHATSAPP_APP_SECRET', label: 'Meta app secret', secret: true, hint: 'Checks inbound Meta signatures' },
          { name: 'GREEN_INSTANCE_ID', label: 'Green instance ID', secret: false, hint: 'idInstance from the Green console' },
          {
            name: 'GREEN_API_TOKEN',
            label: 'Green API token',
            secret: true,
            hint: 'apiTokenInstance from the Green console (send + default webhook auth)',
          },
          { name: 'GREEN_API_URL', label: 'Green API URL', secret: false, hint: 'e.g. https://7103.api.greenapi.com' },
          {
            name: 'GREEN_WEBHOOK_TOKEN',
            label: 'Green webhook token',
            secret: true,
            hint: 'Optional. Blank = reuse GREEN_API_TOKEN on Bearer / ?token=',
          },
        ],
      },
      {
        id: 'resend-webhook',
        name: 'Resend webhook',
        description: 'Signing secret for Resend delivery/bounce webhooks (whsec_…).',
        docs: 'https://resend.com/docs/dashboard/webhooks/introduction',
        fields: [{ name: 'RESEND_WEBHOOK_SECRET', label: 'Webhook secret', secret: true }],
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
        description: 'Reads CVs, drafts the career pack and the legal review, and answers from the company notes on the site and on WhatsApp.',
        fields: [
          { name: 'ANTHROPIC_API_KEY', label: 'API key', secret: true },
          { name: 'CV_MODEL', label: 'CV model', secret: false, hint: 'Leave blank for the default' },
          { name: 'ASSISTANT_MODEL', label: 'Assistant model', secret: false, hint: 'Leave blank to use the CV model' },
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
];

export const MANAGED_FIELDS: IntegrationField[] = INTEGRATIONS.flatMap((g) => g.items.flatMap((i) => i.fields));

export function managedField(name: string): IntegrationField | undefined {
  return MANAGED_FIELDS.find((field) => field.name === name);
}
