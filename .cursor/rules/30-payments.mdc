---
description: Payment rails, currency and webhooks
globs: src/lib/payments/**,src/app/api/payments/**,src/lib/company/**,src/lib/integrations/**
---

- The company is in the UAE and candidates pay by UPI. Production rail: `PAYMENT_PROVIDER=eximpe`
  with `NEXT_PUBLIC_CHARGE_CURRENCY=INR` (RBI PA-CB import authorisation, settles abroad, no
  Indian entity). Cashfree is the alternative with the same model. Stripe/Viva cannot do UPI.
- The owner chose Network International on the UAE company: `PAYMENT_PROVIDER=ngenius` with
  `NEXT_PUBLIC_CHARGE_CURRENCY=AED`. Cards only; see docs/payments.md.
- All rails implement `PaymentProvider` in `src/lib/payments/types.ts`. Code above that
  interface must not know which rail is active.
- Amount comes from `chargeAmountMinor()`, never the client. Minor units everywhere; the
  adapter converts (EximPe and Cashfree take rupees, not paise).
- Webhooks: verify signature AND timestamp freshness, then update `payments` and the
  candidate. The browser return URL is a convenience, never proof.
- Checkout refuses when `RAIL_CURRENCIES[provider]` does not include `CHARGE_CURRENCY`.
- The seller in Settings › Company & pricing must match the merchant account exactly (legal
  name, licence, address, statement descriptor). Prices come from `settings.pricing`
  through `priceBreakdown()`; rail keys come from Settings › Integrations.
