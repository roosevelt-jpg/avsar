# S&A Recruitment — interconnected HTML prototype

## Launch
Open `index.html` in a browser. All 44 HTML pages link to one another through the shared navigation and role-based sidebars. For best compatibility run `python -m http.server 8080` from this folder and open `http://localhost:8080`.

## Demo walkthrough
1. Open **Sign In** and select **Candidate**, **Employer**, or **Super Admin** to enter that portal.
2. Browse jobs, apply as a candidate, then inspect applications from the employer or admin portal.
3. Create a vacancy from **Jobs & Hiring**, then verify it appears in **Find Jobs**.
4. Edit the homepage headline in **Website & CMS → Visual Page Editor**, then reload the homepage.
5. Send a contact enquiry and review it in **Admin → CRM / Form Submissions**.
6. Export local demo data from **Admin → Reports & Analytics**.

## Important limitations
This is a functional **front-end demonstration**, not a deployable recruitment backend. Data is stored in browser `localStorage` and is not shared between browsers/devices. Demo role selection is **not authentication**. Do not store real candidate data, documents, credentials, or payments in this prototype. Registration passwords are deliberately not persisted. Database, APIs, RBAC, secure storage, email delivery, payments, immigration workflows, and live analytics require server-side implementation.

The included vacancies and candidate records are illustrative, not verified live content. The new visual design is based on the requested direction, not a complete extraction of the current site's content. External Unsplash imagery and Google Fonts require internet connectivity; layout remains usable offline.

## File structure
- `index.html`, `jobs.html`, ...: standalone navigable entry points
- `assets/styles.css`: responsive shared design system
- `assets/app.js`: page renderer, browser-local data store, demo workflows

## Production handoff
Port shared components to the existing frontend framework; audit existing API/database migrations; map current content into the CMS; implement authenticated server-side endpoints, organization-scoped authorization, migrations, validation, upload scanning, consent, audit trails, email, billing and tests. Do not treat client-side role selection or browser storage as security controls.


## Photography update
The original AI-generated placeholder crops have been removed. Real stock photo URLs are used instead, requiring internet connectivity. See PHOTO_SOURCES_AND_APPROVAL.md for source links and licensing checks.
