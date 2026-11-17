---
description: Payment rails, currency and webhooks
globs: src/lib/payments/**,src/app/api/payments/**,src/lib/company/**,src/lib/integrations/**
---

- The company is in the UAE. Production rail: `PAYMENT_PROVIDER=ccavenue`
  (CCAvenue UAE Hosted Payment Page). Initiate URL is always
  `https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction`
  for test and live.
- Method + payer phone pick currency: India (default) charges **INR** for UPI,
  card and net banking; UAE (+971) card charges **AED**. Amounts come from
  Settings via `checkoutCurrencyForMethod()` + `priceBreakdown()` — never the client.
- All rails implement `PaymentProvider` in `src/lib/payments/types.ts`. Code above that
  interface must not know which rail is active.
- Amount comes from server pricing, never the client. Minor units everywhere; the
  adapter converts (EximPe, Cashfree and CCAvenue take major units, not paise).
- Webhooks: verify signature AND timestamp freshness, then update `payments` and the
  candidate. The browser return URL is a convenience, never proof — except CCAvenue,
  where the encrypted `encResp` on return *is* the proof (decrypt with the working key).
- Checkout refuses when `RAIL_CURRENCIES[provider]` does not include the method’s currency.
- The seller in Settings › Company & pricing must match the merchant account exactly (legal
  name, licence, address, statement descriptor). Prices come from `settings.pricing`
  through `priceBreakdown()`; rail keys come from Settings › Integrations.
