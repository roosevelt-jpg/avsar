-- A candidate asked to talk before paying, or asked us to send the family
-- page to another number. The morning list reads this. Checkout itself
-- stays on payments; this table is only the two actions payments cannot see.

create table if not exists conversion_signals (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references candidates (id) on delete cascade,
  kind          text not null check (kind in ('talk', 'family_send')),
  product       text check (product is null or product in ('package', 'bundle', 'skills_report', 'visa_requirements')),
  amount_paise  integer check (amount_paise is null or amount_paise >= 0),
  payer_phone   text check (payer_phone is null or payer_phone ~ '^\+[1-9][0-9]{6,14}$'),
  sent          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists conversion_signals_created_idx
  on conversion_signals (created_at desc);

alter table conversion_signals enable row level security;

drop policy if exists conversion_signals_staff_read on conversion_signals;
create policy conversion_signals_staff_read on conversion_signals
  for select to authenticated
  using (
    has_permission('dashboard.view')
    or has_permission('leads.manage')
    or has_permission('payments.view')
  );

-- The reading shown above the price. One per candidate, replaced when they
-- ask again. It restates the free score. It is not the paid report.
create table if not exists score_readings (
  candidate_id uuid primary key references candidates (id) on delete cascade,
  body         text not null check (length(body) between 1 and 600),
  created_at   timestamptz not null default now()
);

alter table score_readings enable row level security;

drop policy if exists score_readings_self_read on score_readings;
create policy score_readings_self_read on score_readings
  for select to authenticated
  using (
    candidate_id in (select id from candidates where auth_user_id = auth.uid())
  );
