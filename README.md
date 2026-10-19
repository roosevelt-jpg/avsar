# S&A Recruitment platform (Avsar)

India → Portugal recruitment platform for a UAE-based recruitment company:
a CMS-driven candidate site with a jobs board and one-step apply, a candidate
dashboard that tracks every application, UPI payments through a cross-border
aggregator, and a staff console with role-based access.

**Start here:** `BUILD_SPEC.md` (the full production build spec and phased plan), `AGENTS.md` (how the code is organised and the rules),
`docs/v2-platform.md` (what v2 added, how to switch it on, launch checklist),
`docs/ROADMAP.md` (next tasks), `docs/dev-rules/` (engineering conventions).

Built from the design handoff in `~/Desktop/design_handoff_avsar_platform`
(Direction A, hi-fi, 7 screens; Direction B as an alternative candidate landing).

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · Supabase (Postgres +
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

Run every file in `supabase/migrations/` in order (0001 → 0014) in the Supabase
SQL editor, then `supabase/seed/bootstrap_super_admin.sql` with your email, then set
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`.

## Payments

For a UAE company taking UPI from Indian candidates: `PAYMENT_PROVIDER=eximpe`
and `NEXT_PUBLIC_CHARGE_CURRENCY=INR` (RBI PA-CB import authorisation; no Indian
entity needed). Read `docs/payments.md` before wiring live keys: a Dubai-registered
Stripe account cannot charge UPI.

## Documentation

- `docs/architecture.md` - why it is split in two, and the decisions behind it
- `docs/payments.md` - rails, entity structure, GST
- `docs/session-handoff.md` - running log, newest first

## Before launch

The fee model needs legal review in India and in Portugal. Every page that
carries a disclosure (`/[locale]/selection-rules`, `/refund-policy`, `/privacy`)
is marked DRAFT in the UI and must not be published as it stands. See
`docs/session-handoff.md` for the open list.
