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

| Method | Stripe (UAE) | Cashfree (PA-CB) | Razorpay (domestic) |
|---|---|---|---|
| UPI | no | **yes** | yes |
| Net banking | no | yes | yes |
| RuPay cards | mostly no | yes | yes |
| Visa / Mastercard (Indian issuer) | as an international transaction | domestic | domestic |
| Needs an Indian entity | no | **no** | yes |

UPI and net banking are domestic Indian instruments. On Stripe they exist only
for accounts registered in India, and that is not a setting.

On cards alone, as a cross-border transaction: many Indian debit cards have
international use disabled by default, Indian issuers decline cross-border at
much higher rates than domestic, most RuPay cards do not work abroad, and the
candidate sees a foreign-transaction fee on a purchase quoted in rupees.

## What is built: Cashfree as a cross-border aggregator

`PAYMENT_PROVIDER=cashfree` is the configuration that matches the company being
in Dubai and the candidates being in India.

The RBI licenses **cross-border payment aggregators** (PA-CB). As of January
2026 nineteen entities hold one; Cashfree was the first, and Razorpay, PayU,
BillDesk, Amazon Pay, Juspay and others followed. A PA-CB may collect rupees
from Indian consumers and settle to a foreign entity, which is exactly this
arrangement: the candidate pays by UPI, the Dubai company receives the money.

Cashfree was chosen because it has held the licence longest and its cross-border
product is the most settled. Razorpay's PA-CB is a second file behind the same
interface, not a rewrite.

### Two things about the adapter worth knowing

**Cashfree works in rupees, not paise.** Stripe and Razorpay both take the minor
unit. Getting this wrong charges a hundred times too much or too little, so the
conversion is explicit in `createCheckout` rather than inline.

**Its webhook signs the timestamp together with the body.** The adapter also
rejects anything more than five minutes old: a valid signature stays valid for
ever otherwise, and a captured webhook could be replayed later.

**Checkout opens in the page rather than redirecting.** Cashfree hands back a
`payment_session_id` and its SDK opens the sheet, which is also what puts UPI in
front of the candidate. That is why `clientToken` exists on `CheckoutSession`.

## Cost, at cohort scale

20,000 candidates at ₹2,299 is about ₹46M, roughly €500,000 gross.

| Rail | Rate | Cost |
|---|---|---|
| Domestic UPI (Indian entity) | 0.4% above ₹2,000 | ≈ €2,000 |
| Cashfree PA-CB | 2-4% cross-border | ≈ €10,000-20,000 |
| Stripe international cards | 3-4% plus FX, high declines | worse, before counting lost conversion |

**UPI stopped being free in October 2026.** NPCI introduced 0.4% MDR on P2M
transactions above ₹2,000; below that it is still zero. The fee is ₹2,299, so it
crosses that line by ₹299. About ₹9 per transaction. Dropping the price to stay
under the threshold would trade €3.50 of revenue per candidate for €0.10 of fees,
so the line is crossed deliberately.

## The decision this actually turns on

Choosing Cashfree over Razorpay is not really a payments decision. India's
Emigration Act requires a **registered recruiting agent** to recruit Indian
citizens for work abroad, with a ₹50 lakh bank guarantee, and a UAE entity
cannot hold that registration.

If an Indian entity has to exist for the licence anyway, collecting domestically
through it costs €2,000 instead of €15,000. The question is corporate structure,
and the rail follows from it.

`PAYMENT_PROVIDER` is one word either way.

## Apple Pay

Launched in India on 29 September 2026, with Axis Bank credit cards only, no UPI
and no RuPay. It is a wallet over a card, not a rail: an Indian card inside
Apple Pay charged by a Dubai Stripe account is still a cross-border card
transaction with the same declines and FX.

It arrives free with Cashfree, which is one of the PSPs Apple launched with. No
work, no decision. Worth revisiting if UPI support is added.

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
