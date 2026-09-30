# Stripe onboarding: which entity, and what to type

Written 30 September 2026, from the Dubai trade licence, the MOA and the
bank account details. Nothing here has been entered into Stripe: the passport
and ID fields are yours to fill in, in your own session.

## The fact that decides it

Stripe publishes the list of countries an account may be **registered in** to
accept UPI. As of this writing it reads:

> AT, AU, BE, BG, CA, CH, CY, CZ, DE, DK, EE, ES, FI, FR, GB, GR, HR, HU, IE,
> IT, LI, LT, LU, LV, MT, NL, NO, PL, **PT**, RO, SE, SG, SI, SK, US

The United Arab Emirates is not on it. In the whole payment-method support
matrix, AE appears exactly once, for Link. So a Stripe account on the Dubai
licence can take cards and wallets and nothing Indian: no UPI, no netbanking,
no RuPay rails.

Source: https://docs.stripe.com/payments/upi (Business locations)

That is not a small loss. UPI is how most Indian consumers pay for something
that costs ₹2,299. A card-only checkout aimed at candidates in India will
convert a fraction of what a UPI checkout converts, and many of the cards that
do exist are domestic-only and fail on a foreign acquirer.

## The second problem with the Dubai route

The licence carries one activity:

> Real Estate Buying & Selling Brokerage — Active

Stripe's UAE onboarding asks for the trade licence and a description of what
you sell. A recruitment assessment platform is not real-estate brokerage.
Either the application is refused at review, or it passes and the mismatch
surfaces later, during a dispute or a routine review, which is the worse
outcome: that is when funds get held.

Fixing it means a DED licence amendment to add an activity that covers this,
"Human Resources Consultancy" or "Portals Website Design & Management" or
both. Days, and a few thousand dirhams. It does not fix the UPI problem.

## Recommendation

Put the Stripe account on a **Portuguese** entity.

Both shareholders are Portuguese nationals, which removes the usual friction
in proving a director's identity to a European acquirer. Portugal is on the
UPI list. The business we are describing to Stripe (a recruitment agency
operating under Smith & Adams, placing candidates with Portuguese employers)
is the business that actually happens, and the employer side, the €1,000
placement fee, is invoiced in Portugal in euros anyway.

Keep the Dubai company for what it is licensed to do.

There is already a Stripe account with country PT under the name SMTADM
(`acct_1ULJUeDdQLZiXO6m`), charges not yet enabled. That is the account to
finish, with the business renamed to whichever Portuguese entity signs the
candidate terms.

If you decide on Dubai anyway, the platform does not need to change: set
`STRIPE_METHODS=card,link` and drop the UPI copy from checkout. Say so and I
will make that change rather than leave a UPI button that fails in India.

## Data for the form

From the licence and the MOA, for whichever route you take.

### Company

| Field | Value |
|---|---|
| Legal name | SMTADM REAL ESTATE L.L.C |
| Legal type | Limited Liability Company |
| Trade licence no. | 1174293 |
| Commercial register no. | 1962728 |
| DCCI no. | 456046 |
| Issuing authority | Dubai Department of Economy and Tourism |
| Issued / expires | 19 Apr 2023 / 18 Apr 2027 |
| Licensed activity | Real Estate Buying & Selling Brokerage |
| Registered address | Office 102-08, Salem Abdullah Bin Dasmal Building, Al Quoz Industrial First, Dubai |
| Phone | +971 52 318 5409 |
| Share capital | AED 300,000, 300 shares of AED 1,000 |
| Incorporated | Federal Decree-Law No. 32 of 2021 |

### Owners and directors

Both hold 50%, both are Managing Directors, singly or jointly (MOA Art. 10),
both Portuguese nationals:

- Muhammad Adam Ismail, person no. 1286969
- Muhammad Furkan Ismail, person no. 1286949

Stripe will ask each of them for a passport number, date of birth and a
document scan. Those are on the passport pages and in MOA Article 10. Enter
them yourself: I do not put government identifiers into forms.

Both are listed as beneficial owners at 50%, so neither can be left out of the
ownership declaration. Stripe holds payouts until every listed owner has
cleared verification, which is the single most common reason an account sits
at "charges not enabled".

### Bank account (Dubai route only)

SMTADM REAL ESTATE L.L.C, AED current account, IBAN on file. A UAE Stripe
account settles in AED; the price is set in euros, so every payout carries an
FX conversion in addition to Stripe's fee.

On the Portuguese route the payout account must be a euro IBAN in the name of
the Portuguese entity. Stripe will not pay out to an account in a different
name from the registered business.

## What is still missing either way

1. The entity decision above.
2. A payout bank account matching that entity.
3. `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` pushed to Vercel. The live
   key goes nowhere until the entity is settled.
4. A live-mode check that UPI actually appears at checkout. Test mode accepts
   `payment_method_types[0]=upi` on the PT account, but test mode is permissive
   and is not evidence about live.
