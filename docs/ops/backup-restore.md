# Backup and restore

What holds data, how it is backed up, and how to get it back. Read this before
you need it, and rehearse a restore once a quarter on a scratch project.

## What we hold, and where

| Data | Where | Backed up by |
|---|---|---|
| Candidates, applications, payments, CMS, audit log | Supabase Postgres | Supabase daily backups; point-in-time recovery if enabled (Pro plan add-on) |
| CVs, voice introductions | Supabase Storage buckets `cvs`, `voice-intros` (private) | **Not** included in database backups. See "Storage" below |
| CMS images | Storage bucket `cms-media` (public) | Same as above |
| Code, migrations | GitHub | Git |
| Environment variables | Vercel project settings | Nowhere else. Keep the list in `docs/ops/secrets.md` current |

## Database

**Daily backups** are kept by Supabase (7 days on Pro). Point-in-time recovery
(PITR) restores to any second in the retention window and is worth the cost
once real candidates and payments are in the system: a bad bulk update at 14:05
can be undone to 14:04 instead of to last night.

**Our own copy, weekly.** Supabase backups live in the same account as the
data. A weekly logical dump stored elsewhere protects against losing the
account itself:

```bash
# Connection string: Supabase → Project settings → Database → Connection string (session mode)
pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --no-privileges \
  --exclude-schema=storage --exclude-schema=supabase_functions \
  --file "avsar-$(date +%F).dump"
```

Store the file encrypted (for example `age` or `gpg`) in a bucket in a
different account and region. It contains personal data: treat it like the
database.

### Restore

1. **Stop writes first.** Set the Vercel project to maintenance (redeploy with
   Supabase env vars removed puts the site in demo mode: pages render, writes
   return 503) so nothing new lands while you restore.
2. **Prefer restoring into a new project** and pointing Vercel at it, rather
   than over the live one. You keep the broken state to investigate.
3. PITR or daily backup: Supabase dashboard → Database → Backups → Restore.
4. From our own dump:
   ```bash
   pg_restore --dbname "$NEW_DB_URL" --no-owner --no-privileges --clean --if-exists avsar-YYYY-MM-DD.dump
   ```
5. Re-run migrations newer than the dump (`supabase/migrations/`, in order).
   They are re-runnable, so running all of them is safe.
6. Update the Supabase URL and keys in Vercel, redeploy, check
   `/api/health`, sign in to `/admin` and open one application.
7. Payment webhooks that arrived during the outage are retried by the
   provider for hours to days; check the provider dashboard for failed
   deliveries and resend them.

## Storage

Database backups do not contain files. Copy the private buckets weekly with
the Supabase CLI or any S3-compatible tool (Supabase Storage speaks S3):

```bash
supabase storage cp -r ss:///cvs ./backup/cvs --experimental
supabase storage cp -r ss:///voice-intros ./backup/voice-intros --experimental
```

A candidate erased through `/admin/privacy` must also disappear from these
copies at the next rotation. Keep at most four weekly copies.

## Rehearsal checklist (quarterly)

- [ ] Restore last week's dump into a scratch Supabase project.
- [ ] Point a Vercel preview at it and sign in to the console.
- [ ] Open an application and download its CV (checks the storage copy too).
- [ ] Note how long it took. That is the real recovery time; update `slos.md` if it is worse than stated.
