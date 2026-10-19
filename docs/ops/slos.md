# Service level objectives

What "working" means, in numbers we can check. These are targets for us, not
promises to anyone; the promises to candidates are in the terms.

## Objectives

| Journey | Objective | Measured by |
|---|---|---|
| Public pages (home, jobs, job detail) | 99.9% of requests succeed, monthly | Vercel analytics: non-5xx share |
| Apply | 99.5% of submissions succeed; p95 under 2.5 s | `applications.apply_failed` log events against applications created |
| Checkout | 99.5% of checkout opens succeed | Ratio of 5xx on `/api/payments/checkout` |
| Payment confirmed | 99% of paid orders marked paid within 5 minutes | `payments.paid_at` minus provider's paid time |
| Staff console | 99.5% of requests succeed during 08:00–20:00 Lisbon | Vercel analytics on `/admin` and `/api/admin` |
| Inbox | Every new message picked up (status not `new`) within 1 working day | `leads` where `status = 'new'` and older than 24 h |
| Privacy requests | Answered within 30 days (GDPR art. 12) | `leads` where `kind = 'privacy'`, open, older than 25 days |
| Candidate decision | Within the stated response window | Applications in `submitted` older than the window |

## Recovery targets

| | Target | Depends on |
|---|---|---|
| Recovery point (data we can lose) | 24 h without PITR; minutes with PITR | Supabase plan |
| Recovery time (back up and running) | 4 h | Rehearsed restore, see `backup-restore.md` |

## Error budget

At 99.5% a month allows about 3.6 hours of failure. If a journey uses more than
half its budget in a month, the next week's work goes to reliability for that
journey before new features.

## Checking

The inbox and privacy objectives can be checked with SQL in the Supabase
editor:

```sql
-- Messages waiting more than a working day
select id, topic, created_at from leads
where status = 'new' and created_at < now() - interval '24 hours'
order by created_at;

-- Privacy requests close to the one-month limit
select id, full_name, created_at from leads
where kind = 'privacy' and status <> 'closed' and created_at < now() - interval '25 days';
```
