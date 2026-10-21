-- The owner's path charges for two documents, not one package.
--
-- A skills report and a visa-requirements list can be bought alone or
-- together. Rows written before this column existed are the old package,
-- which unlocked both, so the default keeps those buyers where they were.
-- The candidate's payment_status stays unpaid until they own both: setting
-- it on the first report would open the second one for free.

alter table payments
  add column if not exists product text not null default 'package';

do $$
begin
  alter table payments
    add constraint payments_product_check
    check (product in ('package', 'bundle', 'skills_report', 'visa_requirements'));
exception
  when duplicate_object then null;
end $$;
