# Owner questionnaire: what changed, and what is still open

Answers received 15 October 2026 (Furkan Ismail and Abilio Diz). This records
what the platform now does because of each answer, the decisions taken where an
answer conflicted with another or with the law, and what still needs the owner,
finance or the lawyer.

## Decisions taken

| Topic | Owner's answer | What the platform does |
|---|---|---|
| Database access (3.3 vs 3.5) | 3.3: free database, package optional. 3.5: "they need to pay to get on our database" | **Free database.** Everyone who finishes the assessment is in the talent pool (migration 0021). The package is optional and gives no priority. 3.3 is the text written for the lawyer, and 3.5 would make the fee a condition of recruitment, which is the shape DL 260/2009 and the Indian Emigration Act prohibit. |
| Candidate success fee (3.6) | €1,000 from the candidate after a job offer | **Not charged.** The employer pays the placement fee; the site says candidates never pay one. Flagged for the lawyer below. |
| Payments (3.1, 3.2, 3.10) | Magnati and Network International, UAE company, AED payouts | Network International (N-Genius) adapter built, charging in AED (`NEXT_PUBLIC_CHARGE_CURRENCY=AED`, `PAYMENT_PROVIDER=ngenius`). Card only. The UPI rails stay in the code as an option. No Magnati adapter yet. |
| Published odds (3.3, 4.10) | 3.3: 10 of 15 shortlisted hired. 4.10: "the goal is" 50/25/10 per 100 | **Only the historical figure** is published, with its basis and "past results are not a promise". 4.10 is a target, not a result, so it is not shown. |
| Shortlist rule (3.3) | Above 7 in the assessment plus the essential requirements | `SHORTLIST_MIN_SCORE = 70`, shown to staff on every application; payment plays no part. |
| Package (3.3) | Four deliverables | Renamed everywhere. The preliminary legal review is a real workflow: `/admin/legal-reviews`, delivered to the candidate dashboard by email. |
| ID at assessment (5.5) | Collect ID or passport | The document vault accepts a national ID card; the dashboard asks package buyers for one. |
| Background questions (5.4) | Add personal background, visa refusals, experience | Dashboard form (migration 0023): earlier visa refusals, work abroad, overstay or removal, family to follow. Shown to staff and on the legal review queue, never to employers. Criminal history is not asked (the police certificate covers it, and GDPR Art. 10 restricts it). |
| What a job includes (4.4, 4.6, 4.7, 5.8) | Housing, food, immigration fees and taxes, legal advice, flight, visa fee, police certificate; 5-year contracts; all arrival support | Copy updated on home, how it works, FAQ, visa, jobs and why-Portugal pages. |
| Interviews and visa (5.6, 5.7) | Zoom; independent lawyers | Copy updated. |
| Staff emails (8.4) | New application and each payment | `STAFF_ALERT_EMAILS` (comma-separated). Also covers employer vacancy requests. |
| Super admins (6.1, 6.2) | Furkan and Abilio only | `supabase/seed/bootstrap_super_admin.sql` names both. |
| Retention (9.2) | 1 year | Daily cron `/api/cron/retention` erases candidates with nothing open and no activity for a year. |
| Data location (9.6) | EU only | Vercel functions pinned to Frankfurt (`fra1`). **The Supabase project must be created in an EU region**; it cannot be moved later without a migration. |
| Company details (1.x, 2.x) | UAE company, Portuguese partner, offices, hours, socials | Seller is the UAE company; Benefit Discovery is named as the Portuguese partner. Footer, contact, terms and privacy updated. |

## Open: for the lawyer

1. **The €1,000 candidate success fee (3.6, 3.7).** Portuguese law (DL 260/2009)
   and the Indian Emigration Act both restrict charging a worker for a
   placement. The platform does not charge it. If the owner still wants it,
   it needs written advice first, and the 60-day refund rule in 3.7 only
   applies to it.
2. **The package fee.** Even optional and with no priority, a fee taken from
   job seekers by a recruiter needs sign-off. The wording on the terms,
   selection rules and checkout was written to that brief.
3. **Trade licence.** "SMTADM REAL ESTATE" suggests a real-estate activity.
   The acquirer and the lawyer should confirm it covers selling assessment
   and career services; if not, a different entity must hold the merchant
   account.
4. **Governing law** in the terms (currently the seller's jurisdiction, Dubai).
5. **EU only (9.6) against our processors.** Email, WhatsApp (Meta) and the AI
   CV service process data outside the EU. The privacy policy says so; the
   lawyer should confirm this satisfies the partners who asked for EU only.
6. **Refund policy** for the package (14 days, nothing downloaded; the legal
   review is still owed after a download).

## Open: for the owner and finance

- **Registered office address** of the UAE company (1.3 was blank). The
  Dubai office address is used until then.
- **Statement descriptor** (3.9 was "??"). Make a small live payment and read
  the bank statement; set `ENTITY.statementDescriptor` to match.
- **Price in AED.** ₹2,400 is set as AED 105 in `ASSESSMENT_FEE.aed`. Finance
  to confirm, and to confirm the tax answer (3.8) covers Indian IGST on online
  services sold to Indian consumers, not only UAE VAT.
- **Indian cards abroad.** Network International charges an international
  card payment; many Indian debit cards block those by default. The checkout
  tells candidates how to turn it on. Watch the decline rate in the first
  weeks; if it is high, a UPI rail through an Indian partner is the fix.
- **Magnati.** No adapter yet. Say if it should replace or sit beside Network.
- **Spain (4.9).** Not built. Jobs, visa copy and legal pages are Portugal-only.
- **Languages (7.5).** The owner listed English, Hindi, Malayalam, Tamil,
  Punjabi and Telugu. The site also ships Bengali, Marathi, Gujarati, Kannada,
  Odia, Assamese, Urdu and Arabic. Say whether to hide those. Sentences that
  changed in this round show in English in every other language until they
  are re-translated.
- **WhatsApp (8.1, 8.2).** No Business API provider yet; messages go by email
  until one is set up (Meta Cloud API is already supported).
- **Two-step sign-in (6.7).** The owner said no need. It stays optional
  (`STAFF_REQUIRE_MFA`), but with two super admins holding every candidate's
  data it is strongly recommended.
- **Analytics (10.7).** Waiting for Alex's details.
- **Testimonials (7.4).** Script and consent wording in
  `docs/testimonials-script.md`.

## Content already in the database

If the CMS pages were saved in the console before this change, the saved
copies still use the removed tokens `{{hire_rate}}`, `{{funnel_call}}` and
`{{funnel_presented}}`, which now show as written. Open each page in the
console and use "Reset to default content", or replace them with `{{shortlist_hired}}`,
`{{shortlist_size}}` and `{{shortlist_score}}`.
