# Platform v2: jobs, applications, CMS and RBAC

October 2026. What was added on top of the assessment platform, how to switch it
on, and what must be true before launch.

## What candidates get

| Route | What |
|---|---|
| `/[locale]` | Home page, rendered from the CMS, pre-filled with launch copy |
| `/[locale]/jobs` | Jobs board: search, role and city filters (plain GET form, shareable URLs) |
| `/[locale]/jobs/[slug]` | Job page: salary, housing, visa, requirements, similar jobs, Google for Jobs JSON-LD |
| Apply panel | **One form creates the account and applies.** Signed-in candidates apply in one tap. Screening questions per job. |
| `/[locale]/dashboard` | Now opens with "My applications" above the assessment report |
| `/[locale]/dashboard/applications` | Tracker: 7-step progress bar, plain-language stage explanation, history with recruiter messages, withdraw, suggested jobs |
| `/[locale]/how-it-works`, `/why-portugal`, `/visa-and-relocation`, `/faq`, `/stay-safe`, `/about` | CMS pages with finished default content |
| Email | "Application received" and every visible stage change (Resend or SES) |

Applying is free. A paid assessment is optional and can be made mandatory in
Site settings (off by default; see the legal notes below).

## What staff get (`/admin`)

| Screen | Permission |
|---|---|
| Dashboard (what needs attention) | `dashboard.view` |
| Jobs: list, create, edit, publish, close, archive | `jobs.view` / `jobs.edit` / `jobs.publish` |
| Applications: filter by stage, job, name; detail with answers, history; move stage, message candidate, rate | `applications.view` / `applications.manage` |
| Pages (CMS): block editor, per-language versions, preview, publish, version history, reset to default | `cms.view` / `cms.edit` / `cms.publish` |
| Media library: direct-to-storage uploads (images, video to 100 MB, PDF), alt text | `media.manage` |
| Site settings: contact details, navigation (en/hi/ar labels), announcement bar, footer, application rules, SEO | `settings.manage` (application rules need `jobs.publish`) |
| Payments: list, totals, CSV export | `payments.view` |
| Staff: invite, change role, deactivate | `staff.manage` |
| Roles and permissions matrix, custom roles | `roles.manage` |
| Audit log | `audit.view` |
| Existing: talent search, shortlists, CV queue, cohorts, employers, placements | unchanged screens, now permission-guarded |

### Roles shipped

| Role | For |
|---|---|
| Super admin | Everything, including roles. Keep to one or two people. |
| Admin | Day-to-day running; cannot edit role permissions or create super admins |
| Recruiter | Jobs and the application pipeline, employers, placements |
| Reviewer | CV and assessment review; read-only applications |
| Content editor | Drafts and media; cannot publish |
| Content manager | Edit and publish pages, media, site settings |
| Finance | Payments and refunds |
| Support | Read-only, to answer candidate questions |

Permissions are enforced three times: the console hides what you cannot use,
every API route checks, and Postgres RLS checks `has_permission()`.

## The CMS in one paragraph

Each page is a list of typed blocks (hero, trust bar, numbers, steps, feature
grid, image and text, open jobs, job categories, film, gallery, testimonials,
FAQ, call to action, text, notice, contact cards). The registry in
`src/lib/cms/blocks.ts` generates the editor forms and the sanitiser. Every page
ships with finished content in `src/lib/cms/defaults/`, so the site is complete
before anyone logs in; editing a page saves a draft, publishing makes it live,
and "Reset to default" returns it to the shipped copy. Hindi and Arabic fall back
to English until a translated version is published. Numbers that are decided in
code (fee, response time, published odds) are typed as placeholders such as
`{{fee_inr}}`, so they cannot drift from what checkout charges.

## Switching it on

1. **Migrations.** Run `supabase/migrations/0014_rbac_jobs_cms.sql` in the
   Supabase SQL editor (0001–0013 are already applied in production). It creates
   the `cms-media` storage bucket too.
2. **First super admin.** Edit and run `supabase/seed/bootstrap_super_admin.sql`.
   Existing `admin` staff are promoted to `super_admin` automatically if no super
   admin exists yet.
3. **Optional sample jobs.** `supabase/seed/jobs_sample.sql` inserts four
   complete postings as **drafts**. Publish only after matching each to a real
   vacancy.
4. **Environment.** See `.env.example`. For UPI from a UAE company:
   `PAYMENT_PROVIDER=eximpe`, `NEXT_PUBLIC_CHARGE_CURRENCY=INR`, EximPe keys,
   and register `/api/payments/webhook` in the EximPe dashboard.
5. **Email.** `RESEND_API_KEY` and `EMAIL_FROM`, so candidates hear about their
   applications.
6. **Supabase Auth settings.** Site URL and redirect URLs must include
   `https://<domain>/auth/callback` (staff invitations use it).
7. Deploy, sign in at `/en/signin` with the super admin, open `/admin/dashboard`.

## Before launch: decisions that are not code

These are flagged, not solved. Each one can stop the business, not just a page.

1. **Indian recruiting licence.** Recruiting Indian citizens for work abroad
   requires a Recruiting Agent registered under the Emigration Act 1983 (eMigrate),
   with a bank guarantee. A UAE company cannot hold it; an Indian entity or a
   registered Indian partner is needed. The "Stay safe" page tells candidates to
   check agents on emigrate.gov.in, so the platform must be able to show its own
   registration number. Add it to the About page and footer once you have it.
2. **Charging candidates.** Applying is free and placement fees are paid by
   employers (`PLACEMENT_FEE.payer = 'employer'`). The optional assessment fee
   needs legal sign-off in India; do not switch on "Require a paid assessment
   before applying" without it. Portuguese law (DL 260/2009) prohibits agencies
   charging workers for placement.
3. **Seller of record.** `ENTITY` in `src/lib/data/brand.ts` still names the
   Portuguese company that holds the Viva account. If the UAE company collects
   through EximPe, change `ENTITY` to the UAE company's exact legal name, trade
   licence number and registered address: the merchant record, the footer, the
   receipts and the legal pages must all match.
4. **Tax.** A foreign supplier of online services to Indian consumers may owe 18%
   IGST under India's OIDAR rules. `VAT_RATE` is 0. Confirm with an accountant
   before the first rupee payment.
5. **Data protection.** India's DPDP Act for candidate data; GDPR once data
   reaches Portuguese employers. Keep the privacy page aligned.
6. **Real content.** Sample jobs are drafts. Testimonials block exists but ships
   empty: publish only quotes you have written permission to use.

## What I could not verify here

The build environment that produced this had no access to the npm registry, so
`npm install`, `next build` and the lint run were not executed. All new modules
were type-checked against stubbed library types, the CMS defaults were run
through the sanitiser (every block round-trips unchanged), and all 28 new pages
were server-rendered successfully in demo mode. Run
`npm install && npm run typecheck && npm run lint && npm run build` first.
