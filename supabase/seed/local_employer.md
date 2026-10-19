# Local employer login

For sandbox / local testing of the employer portal only. Not for production.

## Credentials

| Field | Value |
|---|---|
| Sign-in | `/en/signin` (password) → `/admin/employer` |
| Email | `employer.local@avsar.dev` |
| Password | `LocalEmployer1!` |
| Company | Local Demo Employer (Lisbon) |

## Create / refresh the account

From the repo root, with `.env.local` pointing at your **non-production** Supabase project:

```bash
node --env-file=.env.local scripts/seed-local-employer.mjs
```

Or:

```bash
npm run seed:employer
```

The script creates the Auth user (or resets the password), the `employers` row, and the `employer_users` link. Safe to run again.

If your project URL contains `prod` / `production`, set `ALLOW_LOCAL_SEEDS=true` to override the safety check.
