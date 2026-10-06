> **Superseded, 6 October 2026.** Candidates are collected through EximPe, on
> the Dubai entity. An RBI PA-CB *import* authorisation takes rupees by UPI and
> settles abroad whatever the merchant's country, so the constraint this whole
> note was written around, that Stripe will not do UPI from a UAE-registered
> account, stopped deciding anything.
>
> Kept because the reasoning still holds for Stripe itself, which remains the
> rail for employer invoices in euros, and because the UPI business-locations
> fact below is the one people re-derive.

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

## Decision

The Stripe account goes on the **Portuguese** entity: Benefit Discovery, Lda.

Both shareholders are Portuguese nationals, which removes the usual friction
in proving a director's identity to a European acquirer. Portugal is on the
UPI list. The business we are describing to Stripe (a recruitment agency
operating under Smith & Adams, placing candidates with Portuguese employers)
is the business that actually happens, and the employer side, the €1,000
placement fee, is invoiced in Portugal in euros anyway.

Keep the Dubai company for what it is licensed to do.

There is already a Stripe account with country PT under the name SMTADM
(`acct_1ULJUeDdQLZiXO6m`), charges not yet enabled. That is the account to
finish, renamed to Benefit Discovery, Lda.

`ENTITY` in `src/lib/data/brand.ts` now carries the Portuguese company, so
every policy page, the contact page and the footer print it.

## Data for the form

### Company

| Field | Value |
|---|---|
| Legal name | BENEFIT DISCOVERY, LDA |
| Legal form | Sociedade por quotas |
| NIPC | 517818817 |
| Registered office | Avenida da Liberdade 69, 4.º A, 1250-140 Lisboa |
| Share capital | EUR 5,000 |
| Financial year end | 31 December |
| Binding | One gerente acting alone |
| Registry proof | Certidão permanente, valid to 09 Jul 2027. Give Stripe the access code if asked; it is not written down in this repo. |

### Director and owner

Teresa Cláudia Viegas Gama, NIF 310597501, is the sole gerente since the other
gerente resigned on 23 May 2024, and acquired the second quota the same day.
Treat them as holding 100% unless the accountant says otherwise.

That has a practical consequence: **they have to do the Stripe onboarding**, or
at minimum be named as the account representative, sign the terms and clear
identity verification. Stripe holds payouts until the representative and every
owner above 25% are verified. There is no way to complete this without them.

Their citizen card carries everything Stripe asks for. Enter it yourself: I do
not put government identifiers into forms.

### Payout account

Novobanco, EUR, in the name BENEFIT DISCOVERY. It matches the registered name
closely enough for Stripe, which refuses payouts to an account in a different
name. The IBAN is on the bank letter, not in this repo.

### Statement descriptor

Set it deliberately. A candidate signs up at **S&A Recruitment** and pays
₹2,299. If their bank app then shows BENEFIT DISCOVERY, a good share of them
will call it fraud, and a UPI dispute cannot be contested: Stripe pulls the
money back immediately.

So: set the Stripe "doing business as" to S&A Recruitment, set the statement
descriptor to something like `SA RECRUITMENT`, and say on the checkout page
what the charge will look like. Stripe will ask for evidence of the trading
name; the site itself, under the Smith & Adams brand, is that evidence.

## Two gaps that are not Stripe's

**1. A Portuguese telephone number.** `ENTITY.phone` is empty, so the policy
pages currently show the honest-gap banner instead of a number. I did not carry
the Dubai mobile across: a Portuguese company publishing a UAE mobile reads as
a front, and Stripe's review looks at the site. Send a number and it is a
one-line change.

**2. The company's registered object does not mention recruitment.**
Raised 30 Sep 2026 and deferred by Abílio the same day. Recorded here because
it does not stop being true while it is parked.
 The
objecto covers construction, business and management consultancy, support
services to companies, administrative services and debt collection. The
principal CAE is 43350, building finishing. Recruitment is CAE 78100.

Stripe is unlikely to check that closely. The Portuguese state is the one that
checks: placing candidates with employers is a *agência privada de colocação*
under Decreto-Lei 260/2009, which requires a licence from the IEFP. Running it
from a Portuguese company makes that directly applicable in a way the Dubai
company did not, which is the trade-off that came with today's decision.

Adding CAE 78100 and amending the objecto is an online alteration at the
registry, a few days and a few hundred euros. The IEFP licence is the longer
one and belongs on the critical path, not after launch.

## What I need to switch payments on

```
PAYMENT_PROVIDER=stripe
STRIPE_METHODS=card,upi
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

The keys go in `.env.local` and up through `scripts/push-env.sh`. Nothing else
in the codebase changes.
