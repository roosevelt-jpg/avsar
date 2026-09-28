# Avsar

India → Portugal talent and mobility platform.

Built from the design handoff in `~/Desktop/design_handoff_avsar_platform`
(Direction A, hi-fi, 7 screens; Direction B as an alternative candidate landing).

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · Supabase (Postgres +
RLS + Auth) · Stripe.

## Running it

```bash
npm install
cp .env.example .env.local   # works with everything blank
npm run dev
```

With no environment variables the app still runs end to end: the talent pool
falls back to the sample data from the prototype, and checkout returns a
simulated session so the sign-up flow stays clickable. Nothing is charged.

```bash
npm run typecheck
npm run lint
npm run build
```

## Database

Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor, then set
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`.

## Payments

Stripe by default. A domestic Indian rail (UPI) sits behind the same interface.
Read `docs/payments.md` before wiring live keys: a Dubai-registered Stripe
account cannot charge UPI, and that is the main conversion question for this
product.

## Documentation

- `docs/architecture.md` - why it is split in two, and the decisions behind it
- `docs/payments.md` - rails, entity structure, GST
- `docs/session-handoff.md` - running log, newest first

## Before launch

The fee model needs legal review in India and in Portugal. Every page that
carries a disclosure (`/[locale]/selection-rules`, `/refund-policy`, `/privacy`)
is marked DRAFT in the UI and must not be published as it stands. See
`docs/session-handoff.md` for the open list.
