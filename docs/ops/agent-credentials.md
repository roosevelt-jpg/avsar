# Credentials for the assistant, WhatsApp, and scheduled jobs

Paste the secret values in the console under Settings › Integrations, or set the same names in the hosting environment. A value saved in the console overrides the environment. Do not commit filled-in secrets.

`INTEGRATIONS_MASTER_KEY` must already be set on the host (at least 32 random characters) before the console can store the others.

```env
# Anthropic. Required for the site chat, WhatsApp replies, CV reading, and legal-review drafts.
ANTHROPIC_API_KEY=
# Optional. Blank uses the default CV model.
CV_MODEL=
# Optional. Blank uses CV_MODEL, then claude-sonnet-4-5.
ASSISTANT_MODEL=

# WhatsApp provider: meta (Cloud API) or green (Green API).
WHATSAPP_PROVIDER=green

# --- Meta Cloud API only (leave blank when using Green) ---------------------
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=
# Meta webhook hub.verify_token. Unused when WHATSAPP_PROVIDER=green.
WHATSAPP_VERIFY_TOKEN=

# --- Green API (https://green-api.com) --------------------------------------
# idInstance and apiTokenInstance from the Green console.
GREEN_INSTANCE_ID=
GREEN_API_TOKEN=
# Host for this instance, e.g. https://7103.api.greenapi.com
GREEN_API_URL=
# Optional inbound secret. Blank = reuse GREEN_API_TOKEN (Bearer or ?token=).
GREEN_WEBHOOK_TOKEN=

# Webhook callback URL (not an env var): https://avsar.myflynai.com/api/whatsapp/webhook
# Green: set that URL in the instance webhook settings; send Authorization: Bearer <token>
# Meta: subscribe the app to the messages field and use WHATSAPP_VERIFY_TOKEN.

# Scheduled jobs and the links inside their messages.
CRON_SECRET=
SITE_ORIGIN=https://avsar.myflynai.com

# Email the automations send. Domain must be verified in Resend first.
RESEND_API_KEY=
EMAIL_FROM=
# Comma-separated. New applications, payments, and vacancy requests.
STAFF_ALERT_EMAILS=

# Hosting only. Not typed into Settings › Integrations.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INTEGRATIONS_MASTER_KEY=
# Set once. Never change it after candidates exist.
IDENTITY_HASH_SALT=
```
