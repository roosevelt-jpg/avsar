# Incident runbook

For when something is broken in production. The aim is, in order: stop the
harm, tell the people affected, fix it, write down what happened.

## Severity

| Level | Meaning | Examples | Respond |
|---|---|---|---|
| SEV1 | Candidates are harmed or money is wrong | Charged twice; personal data visible to the wrong person; site down | Immediately, any hour |
| SEV2 | A core journey is broken | Cannot apply; console cannot move applications; emails not sending | Within 2 working hours |
| SEV3 | Degraded or cosmetic | One page slow; a translation missing | Next working day |

A suspected personal-data breach is always SEV1. Under GDPR the supervisory
authority (CNPD in Portugal) must be told within 72 hours of becoming aware;
under India's DPDP Act the Data Protection Board and the affected people must
be told. Start the clock when you first suspect it, not when you are sure.

## First fifteen minutes

1. **Say you are on it** in the team channel: what you see, the time, that you
   are leading.
2. **Find the request.** Every response carries an `x-request-id` header. Ask
   the reporter for the time and the page; search Vercel logs for the id or the
   path. Server logs are JSON lines with `event`, `requestId` and an `error`.
   Sentry (if `SENTRY_DSN` is set) tags each error with `request_id`.
3. **Check the dependencies** before the code:
   - `/api/health` on the production domain
   - [Supabase status](https://status.supabase.com), [Vercel status](https://www.vercel-status.com)
   - Payment provider dashboard (EximPe or whichever rail is live)
   - [Resend status](https://resend-status.com), Meta WhatsApp Business status
4. **Stop the harm** with the smallest lever:
   - Bad deploy: Vercel → Deployments → previous good one → *Promote to Production*. Takes seconds and is the right first move for anything that started with a deploy.
   - Payments misbehaving: remove the provider's keys in Vercel and redeploy. Checkout then refuses with `payment_misconfigured`; nobody can be charged.
   - Data exposure: take the site offline (remove the Supabase env vars and redeploy). Every page shows "Setup required"; nothing personal is served.
   - Abuse or a flood of sign-ups: set the Turnstile keys if not set, tighten `RATE_LIMITS` in `src/lib/security/rate-limit.ts`.

## Common situations

**Candidates say they paid but the dashboard says unpaid.** The webhook is the
source of truth. Check the provider dashboard for the payment and for failed
webhook deliveries; resend from there. Never mark a payment paid by hand
without the provider's record.

**Emails stopped.** Resend dashboard → Logs. A bounce spike can get the
sending domain paused. `notification_log` in the database shows what the
platform tried to send and the error.

**WhatsApp messages fail.** `notification_log` with `channel = 'whatsapp'`
holds Meta's error code. Code 132001 means the template name or language does
not match an approved template; 131047 means the 24-hour window has closed
(only templates can be sent).

**A retried request did something twice.** Check `idempotency_keys` for the
scope (`apply`, `checkout`, `applications.bulk`, `contact`, `leads.import`).
A row with `status_code` null for more than a minute means the first request
died mid-way; the next retry will run.

## Afterwards

Within five working days, write a short note in `docs/incidents/YYYY-MM-DD-title.md`:
what happened, when it started and ended, who was affected, what we did, and
what we are changing so it does not recur. No blame; the point is the change.
If personal data was involved, record what was notified, to whom and when.
