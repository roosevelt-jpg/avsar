# Dashboards: what each screen does

This is the map of the three signed-in areas of the platform. The company places candidates from **India** with employers in **Portugal**. The recruitment company is in the **UAE**.

| Who | Where they sign in | What they see |
|---|---|---|
| Candidate | `/[locale]/signin` or `/[locale]/applicant/signin` | Candidate dashboard |
| Staff | `/admin/signin` | Staff console |
| Employer | `/admin/signin` (employer account) | Employer portal |

A person only sees menu items their role is allowed to open. A missing item means the role does not have that permission, not that the page was deleted.

Money a candidate pays is the **optional career package** only. It does not buy a shortlist place, an interview, a job, or a visa. The employer pays the placement fee after a hire.

---

## 1. Candidate dashboard

Languages follow the site locale (`/en/dashboard`, `/hi/dashboard`, and the other site languages). The header is the same on every dashboard page:

| Tab | Path | What it is for |
|---|---|---|
| Overview | `/dashboard` | Home: next step, score, package, applications |
| My applications | `/dashboard/applications` | Full tracker of every application |
| Your move | `/dashboard/relocation` | Documents, visa steps, family link, story |
| Find jobs | `/jobs` | Public job board (apply from here) |
| Profile | `/profile` | Name, trade, experience, CV, voice intro |

### Overview (`/dashboard`)

The page always opens with **one next step** (finish profile, take the test, optional package, apply, upload documents, or track applications).

| Block | When it shows | What the candidate can do |
|---|---|---|
| Verify email | Email not confirmed | Resend the confirmation mail |
| Package offer | Just finished the assessment (`?offer=1`) and has not bought the package | Read the offer and jump to checkout |
| Score preview | Assessment done, package not bought | See the score, two stronger axes, one weaker axis. The written report stays locked |
| Hiring now | Always | Open-job count, a few titles, and the public funnel once enough people have finished the test |
| Checkout | Assessment done, package not bought | Pay by UPI, card, or net banking (whatever the live rail offers). Shows seller name, address, receipt, refund line, and support WhatsApp |
| My applications | Always | Last few applications and a link to the full tracker. Applying is free |
| Saved jobs | They have saved any | Open a saved job and apply |
| Skills report | Assessment scored | Overall, English, skills, experience. PDF download only after payment and a verified email |
| Career pack | Package paid | Generate and read strengths, improvements, interview notes, and the prepared CV |
| Preliminary legal review | Package paid | Read the review once staff deliver it, or upload passport/ID so the review can start |
| Share with family | Package paid | Create a private progress link. The link shows job, city, and steps. It does not show salary, employer, or documents |
| Your background | Always | Visa refusals, work abroad, overstay, family to follow. Staff and lawyers see this. Employers do not |
| Visible to employers | Always | Turn off being shown in the talent pool |
| WhatsApp updates | Always | Opt in or out of WhatsApp stage messages. Email continues either way |

After a successful payment the return URL highlights family sharing once.

### My applications (`/dashboard/applications`)

- Counts of applications in progress and closed.
- Each application shows the candidate-facing stage (plain language, not the staff label) and interview times when one is booked.
- Suggested jobs for their trade, excluding jobs they already applied to.
- They can withdraw an open application from the tracker.

### Your move (`/dashboard/relocation`)

Open before an offer, so a passport and police certificate can be checked early.

| Part | What it does |
|---|---|
| Document vault | Upload passport, national ID, police certificate, and the other visa-file documents. Staff mark them checked |
| Steps | The relocation plan (visa, travel, arrival) once staff start a plan on a hire. Dates and the next step |
| Family links | Same private family page as on the overview |
| Your story | Only after they are placed. Their own words. Staff approve before anything is published. Nothing is invented |

### Profile (`/profile`)

Trade, years, location, CV upload, and an optional voice introduction. The profile must be usable before the assessment is the sensible next step. The assessment itself lives at `/assessment` (free, on the phone, section by section).

### What candidates never do here

- They do not pay to join the database or to apply.
- They do not see other candidates.
- They do not message employers directly. Interviews are arranged by the recruiter.

---

## 2. Staff console

Sign in at `/admin/signin`. The left menu is filtered by permission. Super admins see everything.

### Overview

| Screen | Path | Permission | What it does |
|---|---|---|---|
| Dashboard | `/admin/dashboard` | `dashboard.view` | Live counts (waiting for review, interviews, offers, live jobs), KPIs for the chosen date range, trends, hiring funnel, payment mix, upcoming interviews. Cards hide when the role cannot see that data |
| Notifications | `/admin/notifications` | any signed-in staff | The bell: payments, new applications, vacancy requests, and other staff alerts |

### Hiring

| Screen | Path | Permission | What it does |
|---|---|---|---|
| Jobs | `/admin/jobs` | `jobs.view` | List postings. Filter by status. Create (`jobs.edit`), publish or close (`jobs.publish`) |
| Job editor | `/admin/jobs/new`, `/admin/jobs/[id]` | view / edit | Title, city, salary, what is included, requirements. Duplicate a posting |
| Applications | `/admin/applications` | `applications.view` | Pipeline across all jobs. Filter and search. Bulk move needs `applications.manage`. Export when the role may export |
| Application | `/admin/applications/[id]` | `applications.view` | One person: answers, CV download, stage history, notes, interviews, scorecards. Moving the stage (`applications.manage`) writes history first, then emails and WhatsApp (if they opted in) |
| Placements | `/admin/placements` | `placements.manage` | Hires after offer: hired, visa, relocated. Moving to hired creates the employer placement fee |
| Cohorts | `/admin/cohorts` | `candidates.view` | The intake window (name, close date, review and announce dates) |

**Application stages (staff words).** The candidate sees a different sentence for the same stage.

`Submitted → Screening → Shortlisted → Interview → Offer → Hired → Visa processing → Relocated`

Stopped stages: `Rejected`, `Withdrawn`.

Shortlist rule used by staff: assessment score above the threshold in Company & pricing (default 7 out of 10) **and** the job’s essential requirements. Buying the career package does not change this.

### Candidates

| Screen | Path | Permission | What it does |
|---|---|---|---|
| Talent search | `/admin` | `candidates.view` | Search people who finished the assessment. Filter by words, sector, English level. Employers who open this URL are sent to their own home |
| Shortlists | `/admin/shortlists` | `candidates.view` | Saved groups of candidates for a role or an employer |
| CV queue | `/admin/cvs` | `cv.review` | CVs waiting for a human read after upload |
| CV review | `/admin/review/[id]` | `cv.review` | Read one CV and record the decision |
| Assessment items | `/admin/items` | `cv.review` | How each test question behaves: how many answered, difficulty, discrimination. **Recompute weights** rebuilds the stats from submitted answers. A negative discrimination usually means the answer key is wrong. An item is only weighted after 30 responses |

### Relocation and legal

| Screen | Path | Permission | What it does |
|---|---|---|---|
| Legal reviews | `/admin/legal-reviews` | `relocation.manage` | Every package buyer is owed one preliminary document review. Write it, then deliver it. Delivery emails the candidate and sends WhatsApp if they opted in. A delivered review is not rewritten here |
| Relocation | `/admin/relocation` | `relocation.manage` | Visa documents to check, start a milestone plan on a hire, move steps, approve or decline a candidate story before it can appear on the website |
| Profile requests | `/admin/unlocks` | `relocation.manage` | An employer asked to see a shortlisted applicant’s full name. Approve or decline. Contact details are not released; the recruiter still makes the introduction |

### CRM

| Screen | Path | Permission | What it does |
|---|---|---|---|
| Leads and messages | `/admin/inbox` | `leads.manage` | Contact form and imported leads. Assign, change status, add a note, send a follow-up. WhatsApp only if that person agreed |
| Lead | `/admin/inbox/[id]` | `leads.manage` | One lead’s thread |
| Email subscribers | `/admin/subscribers` | `leads.manage` | People who joined the newsletter. Job-alert mail uses this list |
| Employers | `/admin/employers` | `employers.manage` | Employer companies and the logins that use the employer portal |

### Finance

| Screen | Path | Permission | What it does |
|---|---|---|---|
| Payments | `/admin/payments` | `payments.view` | Career-package payments: status, receipt, method. Export CSV. Refunds need `payments.refund` |
| Employer fees | `/admin/fees` | `payments.view` | Placement fees the **employer** owes after a hire. Mark invoiced or paid with `fees.manage`. Never a candidate charge |

### Website

| Screen | Path | Permission | What it does |
|---|---|---|---|
| Pages | `/admin/cms` | `cms.view` | Every public page (home, FAQ, how it works, legal pages). Edit drafts with `cms.edit`. Publish or restore a version with `cms.publish` |
| Page editor | `/admin/cms/[slug]` | `cms.view` | Blocks on one page. Preview before publish |
| Media library | `/admin/cms/media` | `media.manage` | Images and files used in pages |

Content is blocks, not raw HTML. Do not paste invented quotes. Candidate stories on the public site come only from approved relocation stories.

### Settings

| Screen | Path | Permission | What it does |
|---|---|---|---|
| General | `/admin/settings` | `settings.manage` | Site name, support phone, WhatsApp, emails, office hours, social links, announcement |
| Navigation | `/admin/settings/navigation` | `settings.manage` | Header and footer links |
| Search and sharing | `/admin/settings/seo` | `settings.manage` | Default titles, descriptions, and share images |
| Applications | `/admin/settings/applications` | `jobs.publish` | Whether applying requires the package (keep this off), quick apply, explainer film |
| Emails | `/admin/settings/emails` | `settings.manage` | Subject and body of each mail (welcome, reminders, payment receipt, legal review, stage updates) |
| Conversion and package | `/admin/settings/conversion` | `settings.manage` | Trust lines, package deliverables, post-test offer, pricing page wording |
| VSL funnel | `/admin/settings/vsl` | `settings.manage` | The paid-traffic page at `/go` |
| Company and pricing | `/admin/settings/company` | `company.manage` | Legal name, address, package price and currency, shortlist score, historical hire figures, days to deliver the report and the legal review |
| Integrations | `/admin/settings/integrations` | `integrations.manage` | Payment rail, email, WhatsApp, and other keys. Secrets are stored encrypted. The console value overrides the hosting environment within about a minute |

Production payment default in code is **EximPe in INR** (UPI). Switch the rail here only when finance has the merchant account. N-Genius is cards in AED and has no UPI.

### Administration

| Screen | Path | Permission | What it does |
|---|---|---|---|
| Staff | `/admin/staff` | `staff.manage` | Invite people and assign roles |
| Roles and permissions | `/admin/roles` | `roles.manage` | What each role may open. Super admin only in practice |
| Audit log | `/admin/audit` | `audit.view` | Who changed what (jobs, stages, settings, payments, legal reviews) |
| Privacy requests | `/admin/privacy` | `privacy.manage` | Export or erase a candidate. Erase also removes their stored files |
| Sign-in security | `/admin/security` | signed-in staff | Optional two-step sign-in for that staff account |

### Seeded staff roles

| Role | Typical work |
|---|---|
| Super admin | Everything, including roles and staff |
| Admin | Day-to-day running. Cannot change role permissions |
| Recruiter | Jobs and moving applications |
| Reviewer | CVs and assessment items |
| Content editor | Page drafts and media. Cannot publish |
| Content manager | Edit and publish pages, media, and settings |
| Finance | Payments, receipts, refunds, employer fees |
| Support | Read-only, to answer candidate questions |

---

## 3. Employer portal

Same sign-in page as staff (`/admin/signin`), with an employer account. Home after sign-in is `/admin/employer`.

Employers see **their** vacancies and the people recruiters have already shortlisted. They do not see the screening queue, rejected applicants, contact details, or other employers’ data.

| Screen | Path | What it does |
|---|---|---|
| Home / search talent | `/admin/employer` | Welcome with the company name, vacancy count, shortlisted-applicant count, and how many people have finished the test. Under that, the same talent search staff use, limited to what an employer may see. The welcome suggests the next action: request a vacancy, search, or open applicants |
| Vacancies | `/admin/vacancies` | Request a role (title, city, openings). Staff turn an approved request into a live job. The employer does not publish to the public board themselves |
| Applicants | `/admin/applicants` | Shortlisted people on this employer’s jobs, best fit first. First name is shortened until staff approve a profile request. Fit score is a guide. Scorecards can be filled. Interview booking stays with the recruiter. CSV download of this list |
| Placements | `/admin/placements` | Hires moving through visa and arrival, for this employer |
| Shortlists | `/admin/shortlists` | Lists the employer or staff saved |
| Ready to travel | `/admin/bench` | Assessed candidates whose passport and police certificate are already checked. **Hold** asks the team to call this employer first. The hold lasts three days and does not remove the person from the market |

**Profile request.** On an applicant, “request full name” lands in staff **Profile requests**. Staff approve or decline. Phone and email are not handed over on that screen.

---

## 4. How the three dashboards meet

```text
Candidate finishes the free test
        → appears in Talent search (staff and employer)
        → may buy the optional package
              → staff Legal reviews owes them a document check
              → candidate sees the review on Overview when it is delivered

Candidate applies to a job (free)
        → staff Applications
        → recruiter shortlists
              → employer Applicants
              → employer may request the full name (staff Profile requests)
        → interview booked by staff
              → candidate sees the time; WhatsApp if they opted in
        → hired
              → employer fee is created (staff Employer fees)
              → relocation plan can start (staff Relocation, candidate Your move)
```

---

## 5. Rules that apply on every dashboard

1. **Permissions, not job titles.** A menu item is shown only when the role has that permission.
2. **Identity comes from the signed-in session.** A form cannot change who the user is or what the price is.
3. **The package does not change selection.** Shortlist uses the score and the job requirements.
4. **Employers do not see contact details** until a recruiter introduces them. A name release is a staff decision and is audited.
5. **Stories on the website** are written by placed candidates and approved by staff.
6. **Files** (CVs, voice notes, visa documents, photos, avatars) are stored in Supabase Storage, not on the web server.

---

## 6. Related operator notes

- Payment rails: `docs/payments.md`
- WhatsApp template names to approve in Meta: `docs/ops/whatsapp-templates.md`
- Testimonial interviews (real people only): `docs/testimonials-script.md`
- Decisions already taken with the owners: `docs/owner-answers.md`
