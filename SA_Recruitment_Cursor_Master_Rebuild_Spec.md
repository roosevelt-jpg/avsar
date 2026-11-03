# S&A Recruitment — Cursor Agent Master Rebuild Specification

**Status:** Implementation directive | **Target:** https://avsar.myflynai.com/ | **Design:** approved S&A Recruitment mockups in this conversation | **Objective:** exacting visual transformation, preservation of existing business logic, full CMS administration and real data end-to-end.

> **MANDATORY:** This document is a build instruction, not a claim that the repository or database has been audited. Cursor MUST inspect the actual code, schema, routes, APIs, admin, authentication, jobs, assessments, payment providers and deployment configuration before changing anything. Never invent a current framework or replace working infrastructure on assumption.

## 0. Non-negotiable rules

1. Inspect before editing. Work in a feature branch; capture baseline screenshots and run baseline tests. Never delete or overwrite production records. Backup database and media before migrations.
2. Preserve candidate/employer/admin identities, credentials, permissions, application history, CVs, test attempts/scores, invoices, purchases, receipts, subscriptions, localization, email/WhatsApp workflows and URLs. Existing payment products and anti-fraud messaging are business-critical.
3. Implement the approved **navy / champagne gold / warm ivory** S&A Recruitment visual system across *all* marketing pages and shared components. Use approved screenshots as visual references. Do not interpret them as verified factual content.
4. **The new S&A wordmark/logo shown in mockups is the chosen brand direction.** Reconstruct as an original vector SVG with 'S&A', 'RECRUITMENT', 'SMITH & ADAMS' typography and gold rule; review with owner for pixel-level approval. Do not embed the full screenshot as a logo, and do not assume a generated image is production-ready vector artwork.
5. Public text must come from existing content and validated business records. Improve formatting and organization, not factual substance. Any newly written copy or new business claim requires editorial approval. Do not use mockup's fabricated statistics, testimonials, vacancy counts, prices, email addresses or phone numbers.
6. All editorial surfaces are CMS-driven: sections, headings, rich text, media, cards, icons, CTA labels/destinations, navigation, footer, FAQs, trust claims, legal notices, SEO, translations and page order. Operational information (jobs, salary, employers, applications, test results, payments) is read from authoritative domain tables/APIs, **not duplicated as editable CMS text**.
7. No placeholder data, dummy records, unverified employer badges, hardcoded stats or mock backend responses in production. Empty states are first-class UI.
8. Implement backend + migrations + APIs + admin UI + frontend + tests + observability + deployment together; avoid half-wired screens.
9. Protect existing multilingual support (English, Hindi, Bengali, Marathi, Telugu, Tamil, Urdu, Gujarati, Kannada, Odia, Malayalam, Punjabi, Assamese, Arabic as currently exposed). Audit actual available translations before promising full parity. Support RTL where applicable.
10. Meet WCAG 2.2 AA where practical, responsive layouts, Core Web Vitals and SEO. Honor user consent, privacy, recruitment compliance and transparent payment disclosures.

## 1. Mandatory discovery and repository audit

Create `docs/rebuild/01-existing-system-audit.md` documenting:
- Repo structure, package managers, framework versions, frontend/router, backend/framework, ORM, database, migrations, queues, caches, storage/CDN, email, WhatsApp, analytics, hosting, CI/CD.
- Routes and screenshots at desktop 1440px, tablet 768px, mobile 390px for every existing marketing and transactional page.
- Current database ERD and field inventory; users/roles, candidates, employers, jobs, applications, assessments, CV, invoices, transactions, subscriptions, contact requests, admin settings, content, localization, logs.
- Current admin capabilities and gaps; RBAC; translation pipeline; image uploads; scheduled jobs; analytics; payment webhooks.
- All external integrations, API contracts, secrets names (never secret values), authentication/session mechanisms, data-retention rules.
- A content migration map: existing route, existing source, approved design section, destination CMS field, translation strategy, reviewer.
- Existing SEO metadata, sitemap, canonical links, redirects and structured data.
- Automated test baseline and performance measurements. Record existing bugs separately from redesign regressions.

**Decision gate:** Produce `docs/rebuild/02-implementation-plan.md` showing reuse vs new modules, additive migration list, risks, rollback and acceptance criteria. Do not replace stack or redesign authenticated dashboards unless needed for visual consistency and authorized scope.

## 2. Design source of truth and fidelity

Approved references in this conversation: premium Homepage; Job Opportunities; Job Details; Candidate Registration; How It Works; Why Portugal; Visa & Relocation; For Employers; Employer Hire Talent/Enquiry; About Us; Contact Us. Save owner-provided originals to `design/references/` (do not rely on transient chat paths). Obtain originals from owner if unavailable in Cursor workspace. Each page must be implemented from its corresponding screenshot and adapted responsively.

### Tokens (initial values; refine by screenshot comparison)

```css
:root {
  --brand-navy: #142438;
  --brand-navy-deep: #071d31;
  --brand-gold: #b28a49;
  --brand-gold-light: #f2cc82;
  --brand-ivory: #f8f6f2;
  --surface: #ffffff;
  --text-primary: #142438;
  --text-secondary: #475569;
  --border-soft: #e6e1d9;
  --success: #217a54;
  --danger: #b42318;
  --radius-card: 18px;
  --radius-control: 10px;
  --shadow-card: 0 12px 32px rgba(7,29,49,.08);
  --container-max: 1200px;
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', system-ui, sans-serif;
}
```

- Source licensed/self-hosted font files through normal project asset management; no font assets are included in this specification. Use `font-display: swap`.
- Use deep navy navigation and footers, white/ivory backgrounds, restrained gold highlights, editorial serif headings, Inter body copy, rounded premium cards, soft borders/shadows, line-style gold icons, photographic hero gradients and pill/bordered trust indicators.
- Gold CTA with accessible dark text; secondary CTA navy outline or white outline on navy. Clear hover/focus/disabled/loading states. Do not use gold on ivory for small low-contrast text.
- Header: responsive brand lockup, page navigation, language selector, sign-in, gold profile CTA. Mobile menu must be keyboard accessible. Sticky header must not obstruct anchors.
- Footer: existing legal entity names, license/trading disclosures, verified addresses, payment notices, anti-fraud link, privacy/terms/refunds, newsletter, social/contact links.
- Prefer approved real photography from licensed assets or company-provided photos. All CMS images require descriptive alt text, rights/source field, variants, crop/focal point, responsive srcset, AVIF/WebP, lazy-loading below fold. Never represent AI-generated people as real staff or testimonials.
- Build reusable `BrandLogo`, `MarketingHeader`, `MobileNavigation`, `MarketingFooter`, `HeroSplit`, `HeroFullBleed`, `GoldButton`, `OutlineButton`, `TrustStrip`, `FeatureCard`, `IndustryCard`, `JobCard`, `JobFilterPanel`, `StepTimeline`, `Metric`, `SectionHeading`, `MediaPanel`, `FaqAccordion`, `LeadForm`, `FormStepper`, `ConsentField`, `LanguageSwitcher`, `EmptyState`, `CmsSectionRenderer`.
- Breakpoints: 360/390, 768, 1024, 1280/1440; test landscape and 200% zoom. No horizontal overflow. Mobile cards stack; search/filter panel becomes drawer; application CTA sticky on small screens.
- Screenshot-diff each page against approved reference; document unavoidable differences due to truthful content, language expansion, mobile layout and accessible behavior. Never distort real content to match screenshot.

## 3. Page-by-page specification

### A. Homepage `/`
- Premium split/cinematic hero; existing recruitment promise and India→Portugal positioning; two prominent CTAs (create free profile, explore jobs); existing safety banner and verified claims.
- Trust/value strip sourced from approved CMS content and actual policy.
- Dynamic job category tiles; real featured jobs or honest empty state with job alerts; real employer logos only if approved and verified. **Remove existing 'Local Demo Employer' / 'ABCD Company' placeholders from public output.**
- Current six-step application process (do not replace with mockup five steps without owner approval); support/service benefits; real funnel metrics only with minimum sample rules; FAQs; newsletter; strong final CTA.
- Preserve embedded site assistant/WhatsApp, multilingual switching, prices and payment anti-fraud notices.

### B. Job Opportunities `/jobs` (preserve actual route)
- Premium search hero, query/location/category fields, result count computed live; accessible sort; sidebar/drawer filters for category, city, salary, experience, employment type.
- Paginated or cursor-based real jobs, server-side filtering, URL query-state, loading/skeleton, empty state, canonical indexing strategy. Each card shows only real published data: title, city, salary currency/frequency, verified employer status, employment type, benefits, published date, save and apply.
- Never display invented '150+ jobs', fake vacancies, arbitrary salary ranges or employer verification.

### C. Job Details `/jobs/[slug-or-id]`
- Hero with job title, category, city, salary and company info; sticky tabs/anchors for overview, employer, responsibilities, requirements, benefits, location.
- Dynamic verified job fields; accessible Apply CTA, save job, related jobs, application deadline, positions if stored; salary transparency and contract frequency.
- Apply uses current auth/application workflow and respects job status, eligibility, duplicate application and deadlines. `JobPosting` structured data only for real current jobs.

### D. Candidate Registration / existing signup route
- Approved navy/Portugal hero and clean multi-step form. Preserve existing account fields and identity logic. Start with minimum necessary data; progressive profile completion.
- Stages may be personal details, professional details, documents, review; adapt to existing business requirements. **Do not require DOB/gender/nationality merely because shown in mockup**; justify collection and minimize sensitive data.
- Password/OTP verification, autosave drafts, validation, resume, secure uploads, explicit consent, progress, mobile keyboard/input types, error recovery. Existing skills/English test and CV rewriting flow remain functional.

### E. How It Works
- Premium hero and responsive process timeline based on **current live six-stage process**: profile; CV and free skills/English test; apply; recruiter/employer interviews; offer/contract/visa; travel/onboarding.
- CMS-editable descriptions and durations; factual price/fee disclosures fetched from billing configuration; help, selection rules and CTA.

### F. Why Portugal
- Editorial hero, country imagery, real existing content on sectors, lifestyle, employment terms, costs, healthcare and legal pathways. Avoid blanket promises about residency or salary. Category links lead to filtered live jobs.

### G. Visa & Relocation
- Journey, documents, contract/offer stages, visa support, arrival/registration, FAQ, legal disclaimer and CTA. Preserve verified descriptions of services; immigration requirements must have reviewed date/source/owner. Avoid guarantees of visa issuance or exact timelines.

### H. For Employers
- Premium B2B hero and distinct hire talent CTA, benefits, industries, screening/process explanation, compliance, verified case studies (only if real), lead capture and consultation CTA. Use real operational KPIs or omit them.

### I. Employer Hire Talent / Registration
- Three-stage lead wizard: company/contact details; hiring requirements; review/consent. Fields: legal name, country/city, website, sector, company size, contact name/title/email/phone, roles, headcount, skills, experience, city, salary/currency, hiring timeline, notes, consent.
- Validation and anti-spam; draft resume; admin assignment/status; notification email; audit trail; CRM linkage. Consultation scheduling only if a genuine calendar booking integration exists.

### J. About Us
- Approved editorial hero, genuine company mission/vision, real staff/team photos only, existing corporate/legal identity and Portugal placement partner, values and CTA. Do not publish fabricated founding dates, partner numbers or satisfaction rates.

### K. Contact Us
- Candidate/employer segmented enquiry form, topic, contact data, message, consent, routing and spam protection; real verified company phone/email/address/office hours from CMS organization settings; consultation CTA if supported.
- Preserve current published verified contact details unless administrator explicitly updates them. Mockup contact details are not source data.

### L. FAQ & Help Center (required completion)
- Searchable FAQ with candidate/employer categories, application fees, skills tests, scoring, visa, payments, refunds, fraud, account support, employer process. Reuse actual existing FAQ content. Accessible accordion, FAQ schema only where eligible and policy-compliant.

### M. Existing auxiliary and legal pages (must preserve)
- Selection rules, safety/anti-fraud, family information, report prices, refunds, service delivery, terms, privacy, subscription preferences, sign-in, password recovery, candidate dashboard, employer/admin links. Restyle shared components where safe; never break transactional paths.

## 4. CMS-first content model

**Prefer extending the existing CMS and DB schema.** The following are conceptual tables; implement equivalent models in the current framework, with its naming conventions and migration tool. Never duplicate existing tables.

| Entity | Fields (representative) | Constraints / purpose |
|---|---|---|
| `cms_pages` | id, route_key, slug, template_key, status, published_at, seo_id, created_by, updated_by, timestamps | unique route+locale strategy; draft/published |
| `cms_page_translations` | id, page_id, locale, title, meta_description, content_summary, timestamps | unique(page_id, locale) |
| `cms_sections` | id, page_id, section_key, component_type, sort_order, enabled, variant, theme, visibility_rules JSON, timestamps | ordered page builder |
| `cms_section_translations` | id, section_id, locale, heading, eyebrow, body_json, button_texts_json | localized structured content |
| `cms_section_items` | id, section_id, item_key, sort_order, icon_key, media_id, link_id, data_source_key, display_config_json | reusable cards/steps; no raw executable code |
| `cms_media` | id, storage_key, mime, width, height, bytes, alt_text, focal_point_json, rights, uploaded_by, timestamps | secure upload and variants |
| `cms_links` | id, link_key, href_or_route, target, rel, enabled | validated internal/external links |
| `cms_menus` / `cms_menu_items` | id, key, location, parent_id, order, label_translation_key, link_id, visibility | header/footer/mobile navigation |
| `cms_site_settings` | id, key, value_json, locale, updated_by | logo variants, palette, contacts, offices, socials, legal disclosures, feature flags |
| `cms_faqs` / `cms_faq_translations` | id, category, sort_order, published, question, answer | category + localized Q&A |
| `cms_seo` | id, title, description, canonical, robots, og_media_id, schema_config_json | per-page SEO |
| `cms_redirects` | id, source_path, target_path, status_code, active | preserve legacy URLs |
| `cms_revisions` | id, entity_type, entity_id, before_json, after_json, actor_id, action, created_at | audit/rollback |
| `cms_publish_events` | id, page_id, revision_id, actor_id, scheduled_for, published_at, status | approval and scheduled publication |
| `cms_translations` | id, locale, namespace, key, value, status, reviewed_by | existing i18n system first |
| `cms_forms` / `cms_form_fields` | id, form_key, field_key, label, validation_config_json, sort_order, enabled | safe admin-configured marketing forms |
| `cms_form_submissions` | id, form_id, submission_json, user_id, status, assigned_to, consent_version, created_at | PII restricted; encrypted where appropriate |
| `employer_hiring_requests` | id, employer_id nullable, company, contact, role requirements JSON or normalized children, headcount, status, assigned_to, timestamps | B2B lead pipeline |
| `employer_hiring_request_roles` | id, request_id, job_title, quantity, salary_min, salary_max, currency, location, requirements_json | normalize multi-role enquiries |
| `newsletter_subscriptions` | id, email, locale, consent_at, confirmed_at, unsubscribed_at, source | double opt-in if appropriate |
| `job_alerts` | id, candidate_id nullable, email, filter_json, consent_at, active | no-jobs conversion |
| `analytics_events` | id, event_name, anonymous_id, user_id nullable, properties_json, occurred_at | only if no suitable existing analytics; consent controls |

**Operational source of truth:** reuse existing jobs, employers, candidate profiles, assessments, applications, invoices, payments, subscriptions, and statuses. Add fields only where proven missing (e.g. job `slug`, `salary_currency`, `salary_period`, `published_at`, `verified_at`, `verified_by`, `expires_at`, `benefits`, `positions_count`, `application_deadline`), via safe additive migrations and backfills. Avoid storing computed counts as CMS copy.

### CMS editor requirements
- Pages overview, page create/clone/archive, drag-and-drop section ordering, component/variant selector, image picker/crop/focal point, editable card collections, CTA route picker, menu/footer editor, FAQ manager, SEO editor, language translations, legal/contact settings.
- Draft → preview (secure preview token) → editorial review → publish/schedule → rollback. Revisions, actor/time audit, diff, permission checks.
- Roles: superadmin, content editor, translator, legal reviewer, recruitment manager, employer manager, support. Map to existing RBAC; enforce server-side authorization.
- Field schema validation, sanitization, XSS-safe rich text, URL allowlist, upload MIME/size limits, virus scanning where supported, rate limits, accessibility guidance and broken-link checks.
- Dynamic blocks with `data_source_key` whitelist: `featured_jobs`, `job_categories`, `verified_employers`, `recruitment_funnel_metrics`, `pricing_catalog`, `company_contacts`, `faq_collection`. Never allow arbitrary SQL/JS in CMS fields.
- Publish invalidates page/route cache and revalidates sitemap/metadata; media updates propagate.

## 5. API and application contracts

Reuse current endpoints where available; otherwise add versioned endpoints and document OpenAPI specs:

```
GET  /api/public/pages/{slug}?locale=en
GET  /api/public/navigation?locale=en
GET  /api/public/site-settings?locale=en
GET  /api/public/faqs?category=&locale=
GET  /api/public/jobs?q=&category=&city=&salary_min=&sort=&cursor=
GET  /api/public/jobs/{slug}
POST /api/public/contact
POST /api/public/employer-enquiries
POST /api/public/newsletter-subscriptions
POST /api/public/job-alerts
GET  /api/admin/cms/pages
POST /api/admin/cms/pages
PATCH /api/admin/cms/pages/{id}
POST /api/admin/cms/pages/{id}/preview
POST /api/admin/cms/pages/{id}/publish
POST /api/admin/cms/pages/{id}/rollback
POST /api/admin/cms/media
GET  /api/admin/employer-enquiries
PATCH /api/admin/employer-enquiries/{id}
```

Actual route prefixes must conform to existing conventions. Add pagination, filtering, locale fallback, schema validation, idempotency for submissions, auth/RBAC, CSRF where cookie-based, rate limiting, audit logging, consistent error envelopes and documented HTTP status codes. Do not expose unpublished CMS data publicly or PII in analytics.

## 6. Content migration and truthfulness

**Public site verified at 2026-11-03:** current site features India→Portugal recruitment, free candidate profile/test, CV rewriting, optional paid skills report and visa-requirements list, no candidate placement fee, application/interview process, candidate funnel transparency, multilingual navigation, WhatsApp help, employer portal and legal/trading disclosures. These features and statements must be retained and verified with owner before rewording.

- Existing displayed optional document prices: skills report ₹960; visa requirements list ₹1,440; bundle ₹1,920 (versus ₹2,400 separately). **Read prices from actual pricing/payment records, not from this document, and confirm current amounts before publishing.**
- Preserve warning: no payment via WhatsApp/cash/bank transfer; payments only via website, with clear product/fee explanation and receipts.
- Preserve actual current six-step process, rather than adopting mockup's simplified five-step depiction.
- The existing site shows 'Local Demo Employer (Lisbon)' and 'ABCD Company' and repeated benefit text; exclude demo employer data from production queries and deduplicate CMS seed/import content.
- Current site already contains genuine company/trading/partner disclosures; migrate these verbatim to legal footer and relevant pages, subject to compliance review. Do not replace with fabricated Lisbon contact details from mockups.
- Existing site says metrics are live and suppresses rates until 50 completed tests; preserve thresholds, denominator definitions, and caveats. No '98% success', '1,200 placements', '150 vacancies' or '30–45 days' unless independently validated.
- Build an `existing_content_inventory.csv` and `content_approval_matrix.csv`; source text → destination section → owner/editor → legal verification → locale status → publish status. No silently invented claims.

## 7. End-to-end workflows

**Candidate:** marketing CTA → signup/login → verify identity as currently required → profile/CV → assessment → results → jobs search → application → status updates → interviews → offer/relocation. Preserve scores, thresholds, progress and notifications.

**Employer:** landing CTA → enquiry wizard → validation → stored lead → notification/assignment → admin triage → employer account/CRM linkage → job request or consultation. No fake success states.

**Job:** authorized employer/admin create → review and employer verification → publish → search indexing → apply → status change/expiry → unpublish/archive. Publish only approved roles; no synthetic inventory.

**Payments:** existing products/pricing → checkout provider → signed webhook verification → idempotent transaction processing → receipt/entitlement → refunds/status updates. Do not change money flows during UI migration without explicit separate review.

**CMS:** edit → validate → preview → approve → publish → cache revalidation → public render → analytics; support rollback and translations.

**Contact:** select candidate/employer → submit → server validation/anti-bot → encrypted/controlled storage → routed notification → admin status → acknowledgement; avoid leaking contact details.

## 8. Security, privacy, accessibility, SEO, performance

- Auth sessions/cookies secure and HttpOnly, MFA for admins if available, RBAC server-side, least privilege, CSP, HSTS, CSRF defenses, parameterized queries, safe rich text, signed URLs for sensitive documents, audit logs, PII redaction, rate limits, bot defense, backups and tested restore.
- Privacy: consent recording, newsletter unsubscribe, deletion/export requests, retention policies, restricted recruiter access, GDPR-aware handling of EU-related personal data; validate legal basis and cross-border transfers with counsel.
- Accessibility: semantic headings, visible focus, keyboard navigation, skip link, labels/errors, alt text, 4.5:1 contrast for normal text, reduced motion, accessible accordions/dialogs and stepper, RTL support.
- SEO: existing URLs preserved or 301 redirected, canonical tags, hreflang for supported published translations, metadata, sitemap, robots, OG images, BreadcrumbList and legitimate JobPosting schema, noindex drafts/search filters where appropriate.
- Performance targets: mobile LCP ≤2.5s, CLS ≤0.1, INP ≤200ms at p75 where measurable; optimize hero preload, responsive image sizes, font loading, code splitting, caching, server rendering, avoid blocking chat widgets.
- Observability: structured logs, error monitoring, tracing for forms/jobs/payments, CMS publish logs, uptime and conversion funnel dashboards with consent-respecting event tracking.

## 9. Testing and visual QA

Write unit, integration, end-to-end and visual regression tests in the repository's existing framework. Minimum scenarios:

1. CMS editor updates homepage hero; preview works; publish updates frontend; rollback restores previous version.
2. All 11 primary pages render correctly in every supported locale; fallback and RTL tested.
3. Desktop/tablet/mobile screenshot comparisons for every page against approved reference; record deviations.
4. Jobs filter/sort/paginate using seeded *test-only* data; production shows truthful empty state when none published.
5. Job application for guest and authenticated candidate; duplicate and closed-job errors.
6. Candidate signup, save/resume, CV upload, assessment, profile and dashboard retain old data.
7. Employer enquiry submits, persists, triggers notification and appears in admin pipeline.
8. Contact and newsletter workflows, consent, validation, spam/rate limiting.
9. Payments/webhooks/receipts/refunds unchanged and regression tested in sandbox.
10. Admin authorization and unauthenticated draft protection; malicious CMS payload rejected.
11. Link checker, accessibility audit, SEO checks, Core Web Vitals and broken image checks.
12. Migration upgrade/rollback and restore from backup tested in staging.

## 10. Implementation phases and deliverables

**Phase 0 — Audit & safety:** baseline, backups, ERD, route inventory, architecture decision, screenshots, tests, deployment rollback.

**Phase 1 — Design foundation:** logo SVG, tokens, typography, global header/footer, buttons, cards, icon system, responsive primitives, image pipeline, visual storybook/showcase.

**Phase 2 — CMS core:** additive schema, models, APIs, permissions, content editor, translations, media manager, revisions, preview/publish, SEO, nav/footer, cache invalidation.

**Phase 3 — Public pages:** homepage → jobs listing → job details → candidate signup → how it works → why Portugal → visa/relocation → employers → hire talent wizard → about → contact → FAQ, plus existing safety/legal/auxiliary pages.

**Phase 4 — Operational wiring:** live jobs, profiles, assessments, applications, employer leads, notifications, optional reports and payment flows; verify data integrity.

**Phase 5 — Quality:** responsive visual comparison, accessibility, performance, localization, security, SEO, e2e, migration rehearsals and stakeholder sign-off.

**Phase 6 — Staging and launch:** deploy staging; owner reviews content and screenshots; backup; production additive migration; deploy; smoke tests; monitor; documented rollback.

### Required deliverables in repository

```
docs/rebuild/
  01-existing-system-audit.md
  02-implementation-plan.md
  03-database-migrations-and-erd.md
  04-cms-field-map.md
  05-api-contracts.md
  06-design-system.md
  07-page-acceptance-matrix.md
  08-security-privacy-review.md
  09-qa-and-visual-diff-report.md
  10-deployment-and-rollback.md
  existing_content_inventory.csv
  content_approval_matrix.csv
  screenshots/{baseline,reference,implemented,diff}/
```

Code must live in existing frontend/backend directories, not a new disconnected demo project. Include every migration, seed for *structural CMS templates only*, controller/service/model, admin screen, frontend route/component, test and documentation change. Never seed fictitious employers, jobs or reviews into production.

## 11. Definition of done / release gates

- [ ] Owner signs off on vector logo and screenshot-matched design across all primary pages.
- [ ] All visible editable copy, sections, media, CTAs, navigation and SEO controlled by admin CMS.
- [ ] Operational data sourced live from existing authoritative tables; no fake production data.
- [ ] Candidate, employer, assessment, application, payment and notification journeys pass end-to-end regression.
- [ ] Legal and payment disclosures retained and reviewed.
- [ ] No broken routes, links, images, locale switchers, forms or redirects.
- [ ] Staging visual diffs reviewed at desktop, tablet and mobile; accessibility and performance targets checked.
- [ ] Security, migration/rollback, backups, monitoring and deployment validated.
- [ ] Admin handbook documents editing, translation, publishing, media, lead management and rollback.

## 12. Cursor Agent execution prompt (paste with this file attached)

> You are the lead full-stack engineer, design systems engineer, database architect and QA owner for the S&A Recruitment production redesign. Implement `SA_Recruitment_Cursor_Master_Rebuild_Spec.md` against the **existing repository**. First audit the repository, database, routes, admin and integrations, and write the required audit and plan. Obtain and place the approved page mockup screenshots in `design/references/` if not already present; do not claim pixel-perfect matching without them. Preserve existing content, workflows, multilingual support, payments, and legal disclosures. Then build the design system, CMS, additive migrations, backend APIs, admin screens and every public page, connecting all functionality to real data. Do not fabricate employers, jobs, metrics, testimonials or contact details. Work in testable phases, run automated and screenshot-diff tests, repair regressions, and produce a final implementation report with exact files changed, migrations, tests, staging verification, outstanding approvals and rollback instructions. Do not deploy production without explicit approval. Ask only for genuinely missing secrets, inaccessible reference screenshots, or decisions that cannot safely be inferred from code and business records.
