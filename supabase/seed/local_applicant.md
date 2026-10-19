# Local applicant login

For sandbox / local testing of the candidate dashboard only. Not for production.

## Credentials

| Field | Value |
|---|---|
| Sign-in | `/en/applicant/signin` (password) → `/en/dashboard` |
| Email | `applicant.local@avsar.dev` |
| Password | `LocalApplicant1!` |
| Name | Local Demo Applicant |
| Profile | Chef · Mumbai · completed (unpaid) |

## Create / refresh the account

From the repo root, with `.env.local` pointing at your **non-production** Supabase project:

```bash
node --env-file=.env.local scripts/seed-local-applicant.mjs
```

Or:

```bash
npm run seed:applicant
```

The script creates the Auth user (or resets the password) and a `candidates` row with a finished profile. Safe to run again.

If your project URL contains `prod` / `production`, set `ALLOW_LOCAL_SEEDS=true` to override the safety check.

`IDENTITY_HASH_SALT` must match the app (defaults to `avsar-dev-salt` when unset), so the phone hash lines up with live registration.
