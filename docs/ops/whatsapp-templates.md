# WhatsApp Cloud API templates

Approve these in WhatsApp Manager (English, category UTILITY or MARKETING as Meta requires). Names must match `WHATSAPP_TEMPLATES` in `src/lib/whatsapp/index.ts` exactly. Variables are numbered `{{1}}`, `{{2}}`, …

## Existing (applications / leads)

| Name | Body (example) |
|---|---|
| `application_received` | Hello {{1}}, we received your application for {{2}}. Reference {{3}}. |
| `application_update` | Hello {{1}}, an update on {{2}}: {{3}}. |
| `interview_scheduled` | Hello {{1}}, interview for {{2}} at {{3}}. |
| `lead_follow_up` | Hello {{1}}, {{2}} |

## Conversion (score / package / payment / legal)

| Name | Body (example) |
|---|---|
| `score_ready` | Hello {{1}}, your skills score is {{2}} out of 10. Shortlist: {{3}}. Open your dashboard for the optional career package (legal document check, full report, CV). |
| `package_offer` | Hello {{1}}, you finished the free assessment and are in our database. The optional career package ({{2}}) adds a preliminary legal document review, your full report and a CV. No shortlist priority. |
| `payment_received` | Hello {{1}}, payment received. Receipt {{2}}. Your package deliverables are on your dashboard. |
| `legal_review_ready` | Hello {{1}}, your preliminary legal document review is ready on your dashboard. |

Sends only go to candidates with `whatsapp_opt_in_at` set. Without `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`, nothing is sent.
