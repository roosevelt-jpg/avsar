-- ============================================================================
-- 0024: company settings and third-party integrations, edited in the console
--
-- Two new permissions, held by super admins only (they hold '*', so no grant
-- is needed):
--   company.manage       the legal entity, prices and selection figures. The
--                        entity has to match the payment provider's merchant
--                        record and the price is what cards are charged, so
--                        this is narrower than settings.manage.
--   integrations.manage  API keys for payments, email, WhatsApp and the rest.
--
-- integration_secrets holds each key encrypted with AES-256-GCM under
-- INTEGRATIONS_MASTER_KEY, which lives only in the hosting environment. The
-- database never sees a key in clear, and RLS has no policy at all, so only
-- the service role (after the app's permission check) can read the rows.
-- ============================================================================

insert into permissions (key, group_name, description) values
  ('company.manage',      'Administration', 'Company details, prices and the published selection figures'),
  ('integrations.manage', 'Administration', 'API keys for payments, email, WhatsApp and other services')
on conflict (key) do nothing;

create table if not exists integration_secrets (
  name        text primary key check (name ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  ciphertext  text not null,
  iv          text not null,
  tag         text not null,
  hint        text not null default '' check (length(hint) <= 8),
  updated_by  uuid references auth.users (id),
  updated_at  timestamptz not null default now()
);

alter table integration_secrets enable row level security;
