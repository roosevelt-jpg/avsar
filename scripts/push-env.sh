#!/usr/bin/env bash
# Pushes the variables in .env.local to Vercel, one per environment.
#
# Values are piped from the file, so no secret is ever typed on a command line
# or echoed. Re-running replaces existing values.
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE"; exit 1; }

VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  IDENTITY_HASH_SALT
  PAYMENT_PROVIDER
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  CHARGE_CURRENCY
  STRIPE_METHODS
  CASHFREE_APP_ID
  CASHFREE_SECRET_KEY
  CASHFREE_WEBHOOK_SECRET
  CASHFREE_ENV
  ALLOW_SIMULATED_PAYMENTS
  ANTHROPIC_API_KEY
  CV_MODEL
  NEXT_PUBLIC_COHORT_ID
  RESEND_API_KEY
  EMAIL_FROM
  CRON_SECRET
  AWS_SES_REGION
  AWS_SES_ACCESS_KEY_ID
  AWS_SES_SECRET_ACCESS_KEY
  EXIMPE_CLIENT_ID
  EXIMPE_CLIENT_SECRET
  EXIMPE_ENCRYPTION_KEY
  EXIMPE_MERCHANT_ID
  EXIMPE_ENV
  VIVA_CLIENT_ID
  VIVA_CLIENT_SECRET
  VIVA_WEBHOOK_KEY
  VIVA_ENV
  DODO_API_KEY
  DODO_WEBHOOK_KEY
  DODO_PRODUCT_ID
  DODO_ENV
)

for name in "${VARS[@]}"; do
  value="$(grep -E "^${name}=" "$ENV_FILE" | head -1 | cut -d= -f2- || true)"
  if [ -z "$value" ]; then
    echo "skip  $name (empty)"
    continue
  fi
  for target in production preview development; do
    vercel env rm "$name" "$target" --yes >/dev/null 2>&1 || true
    printf '%s' "$value" | vercel env add "$name" "$target" >/dev/null 2>&1
  done
  echo "set   $name (production, preview, development)"
done

echo
echo "Done. Redeploy for production to pick them up:"
echo "  vercel deploy --prod --yes"
