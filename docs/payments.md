# Payments

## The decision

Stripe is the default rail (`PAYMENT_PROVIDER=stripe`). A domestic Indian rail
sits behind the same interface and is switched on with
`PAYMENT_PROVIDER=razorpay`.

Everything above `src/lib/payments/types.ts` is rail-agnostic, so adding or
swapping a provider does not touch the sign-up flow.

## The problem Stripe alone does not solve

The platform entity is in Dubai. Stripe supports UAE-registered businesses, and
a UAE Stripe account can charge Indian cardholders in INR. What it cannot do:

| Method | Stripe (UAE account) | Domestic rail (India) |
|---|---|---|
| UPI | no | yes |
| Net banking | no | yes |
| RuPay cards | mostly no | yes |
| Visa / Mastercard (Indian issuer) | yes, as an international transaction | yes, domestic |
| International cards | yes | limited |

UPI and net banking are domestic Indian instruments. On Stripe they exist only
for accounts registered in India.

This matters more than it looks. UPI is how most people in India pay for
something that costs ₹1,999. On cards alone, and as a cross-border transaction:

- Many Indian debit cards have international usage disabled by default, and the
  cardholder has to turn it on in their banking app first.
- Indian issuers decline cross-border card transactions at a much higher rate
  than domestic ones.
- The candidate may see a foreign-transaction fee and a currency mark-up on
  their statement, on a purchase they were told cost ₹1,999.

At the volumes this model needs, the difference between "UPI available" and
"cards only" is the difference between a viable funnel and an expensive one.

## Options, in order of preference

1. **Dual rail.** Stripe on the Dubai entity for employers and for any
   non-Indian payer, plus a domestic Indian rail for candidates. The domestic
   rail needs either an Indian entity or a provider holding an RBI PA-CB
   (payment aggregator, cross-border) licence that can collect INR on behalf of
   a foreign entity. Razorpay, Cashfree and PayGlocal all have relevant
   licences; confirm the current scope with each before committing.
2. **Stripe only.** Fastest to launch, no Indian entity. Cards only. Model the
   conversion loss before choosing this.
3. **Domestic rail only.** Best candidate conversion, worst fit for employer
   invoicing in EUR.

The code supports all three today.

## Things that are true regardless of the rail

- **India's OIDAR regime.** A foreign supplier selling an online service to
  Indian consumers is liable for 18% GST in India and has to register for it.
  The order summary already shows GST broken out, and `amountMinor` already
  includes it, so Stripe must not add tax on top. This is a filing obligation
  for the Dubai entity, not something the payment provider handles.
- **The amount is set server-side.** The client never sends a price.
- **The webhook is the source of truth.** The browser's return from Checkout is
  a convenience. A candidate who closes the tab still gets their payment
  recorded.
- **The success screen requires a confirmed session.** `?status=success` on its
  own proves nothing; `src/app/[locale]/signup/page.tsx` retrieves the session
  from the provider before showing it.

## Stripe fees

The linked pricing page (`stripe.com/en-pt/pricing`) is for a Portugal-
registered Stripe account. A Dubai-registered account is on Stripe UAE pricing
instead, and Indian cards count as international cards on either. Confirm the
effective rate for INR-presented, international-card transactions with Stripe
before modelling unit economics: at ₹1,999 the difference between a domestic
rate and an international rate plus currency conversion is a few percent of
gross, across tens of thousands of transactions.

## Entity structure this implies

A Dubai entity alone is not sufficient to run the whole model:

- **India.** Recruiting for overseas employment from India requires a
  registered recruiting agent (Protector General of Emigrants, eMigrate), with a
  bank guarantee. A UAE entity cannot hold that registration. An Indian entity
  or a registered partner is needed for the recruitment side. The assessment
  product itself is a different question and needs its own advice.
- **Portugal.** The work-permit application via IEFP is made by the Portuguese
  employer, so a Portuguese entity is needed on the placement side, whether it
  is an owned company or a partner.
- **Data.** The UAE does not hold an EU adequacy decision, so any EU personal
  data reaching the Dubai entity needs standard contractual clauses. The
  architecture already keeps the EU mobility case file in an EU region and the
  Indian talent graph in an Indian region, which makes this much easier to
  defend.

Get all three reviewed together. They interact.
