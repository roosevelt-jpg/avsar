-- Currency the candidate was actually charged in.
--
-- Checkout used to store only amount_paise and method_hint. The receipt and
-- admin list then guessed currency from the rail name (CCAvenue → INR), which
-- was wrong when the UAE outlet charged AED. Persist what checkout sent, and
-- let the gateway response overwrite it when it reports one.

alter table payments
  add column if not exists currency text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payments_currency_check'
  ) then
    alter table payments
      add constraint payments_currency_check
      check (currency is null or currency in ('INR', 'EUR', 'AED'));
  end if;
end $$;

-- Best-effort backfill for rails that only ever charge one currency.
update payments set currency = 'AED' where currency is null and provider = 'ngenius';
update payments
  set currency = 'INR'
  where currency is null
    and provider in ('eximpe', 'cashfree', 'razorpay', 'paytm');
update payments
  set currency = 'EUR'
  where currency is null
    and provider in ('viva', 'stripe', 'dodo');
