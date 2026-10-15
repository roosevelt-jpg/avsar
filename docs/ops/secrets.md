# Secrets

Every credential the platform uses, where it lives, who can see it, and how
to rotate it. Values never go in this file, in git, in `site_settings`, or in
any `NEXT_PUBLIC_*` variable (those are shipped to every browser).

## Where they live

All secrets are Vercel environment variables, set per environment
(Production, Preview, Development). Preview deployments should use sandbox
or test credentials, never production ones: a preview URL can be shared.

## Inventory

| Variable | What it is | Public? | Rotate |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Yes, by design | On project move |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key; RLS is what protects data | Yes, by design | On suspected abuse |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS. Most sensitive value we have | **No** | Every 6 months, and on any staff departure with Vercel access |
| `IDENTITY_HASH_SALT` | Salt for phone and passport hashes (duplicate detection) | No | **Do not rotate casually**: every stored hash stops matching. Only with a planned re-hash |
| `RESEND_API_KEY`, `EMAIL_FROM` | Sends email; the key is also the SMTP password Supabase Auth uses | Key: no | Yearly; update Supabase Auth SMTP at the same time |
| `AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY`, `AWS_SES_REGION` | Alternative mailer | Secret: no | Yearly |
| `ANTHROPIC_API_KEY` | CV assessment model | No | Yearly, and on suspicion |
| `EXIMPE_CLIENT_ID`, `EXIMPE_CLIENT_SECRET`, `EXIMPE_ENCRYPTION_KEY`, `EXIMPE_MERCHANT_ID` | EximPe rail | Secrets: no | Yearly, and on suspicion |
| `CASHFREE_*`, `RAZORPAY_*`, `STRIPE_*`, `VIVA_*`, `DODO_*` (keys and `*_WEBHOOK_*`) | Other payment rails and their webhook verification | Secrets: no (`NEXT_PUBLIC_RAZORPAY_KEY_ID` is public by design) | Yearly, and on suspicion |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API | Token: no | Use a System User token; rotate yearly |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting | No | Yearly |
| `TURNSTILE_SECRET_KEY` | Bot check, server side | No | On suspicion |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Bot check, browser side | Yes, by design | With the secret |
| `SENTRY_DSN` | Error reporting | Low risk | On project move |
| `CRON_SECRET` | Vercel Cron calls carry it; cron routes refuse without it | No | Yearly |
| `STAFF_ALERT_EMAIL` | Where vacancy requests are emailed | Not secret | As needed |
| `STAFF_REQUIRE_MFA` | `true` makes every console page and admin API require an authenticator-app code (enrol at `/admin/security` first) | Not secret | Turn on once all staff have enrolled |

## Rotating a secret

1. Create the new value at the provider. Most allow two live keys at once.
2. Set it in Vercel for Production (and Preview if shared), then **redeploy**:
   env changes only reach new deployments.
3. Check the affected journey (send a test email, open checkout in sandbox).
4. Revoke the old value at the provider.
5. Note the date in the team's credentials log.

## When someone leaves

Remove them from Vercel, Supabase, GitHub, the payment dashboards, Resend and
Meta Business Manager the same day, then rotate `SUPABASE_SERVICE_ROLE_KEY`
and any key they could have copied. Remove their staff role in `/admin/staff`
so their console access ends even if their Supabase account remains.

## If a secret leaks

Treat it as an incident (`incident-runbook.md`). Rotate first, investigate
second. A leaked service role key means assuming the database was read: check
the Supabase logs for unfamiliar IPs and follow the breach-notification steps.
