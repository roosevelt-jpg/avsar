import { makeBlocks, type DefaultPage } from './make';

/**
 * The legal pages: terms, privacy, refunds, selection rules, delivery, contact.
 *
 * A payment provider's merchant review reads these looking for what is sold,
 * for how much, by whom, and what happens if it goes wrong, so each is stated
 * in plain words. Company details and figures are placeholders filled from
 * Settings › Company & pricing, so the pages cannot disagree with checkout.
 *
 * When the substance of the terms, refund policy or selection rules changes,
 * move the consent version in Settings › Company & pricing as well, so what
 * each candidate agreed to stays recoverable.
 */

const ENTITY = `- **{{legal_name}}**, trading as {{brand}}
- {{registered_address}}
- {{registration}}
- Phone {{support_phone}} · {{support_email}}`;

export const TERMS: DefaultPage = {
  slug: 'terms',
  path: '/terms',
  title: 'Terms and conditions',
  purpose: 'The contract with candidates. Payment providers read it during merchant review.',
  seo: {
    title: 'Terms and conditions',
    description: 'Who you contract with, what the optional career package includes, what it costs, and what we undertake to do.',
  },
  blocks: makeBlocks('terms', [
    [
      'document',
      {
        title: 'Terms and conditions',
        updated: '',
        body: `These terms govern your use of this website, the free recruitment database and the optional package sold on it. By registering you accept them.

## Who you are contracting with

${ENTITY}

## What is being sold

Registering, joining our recruitment database and sitting the assessment are free. With your consent, your profile is considered for current and future vacancies within the Smith & Adams group and participating partner companies.

What is sold is the optional Professional Assessment and Career Preparation Package:

- a personalised skills and English assessment report: your strengths, current capabilities and areas to improve;
- a professionally prepared CV, structured so hiring managers can assess your experience quickly, which you can use for any application;
- a preliminary legal due diligence report: our legal team reviews the documents you provide and identifies the relevant immigration requirements for Portugal, missing documents and issues needing further assessment. It is a preliminary assessment, not an authorisation to work and not a guarantee of visa eligibility or approval;
- individual career recommendations: practical guidance on improving your profile and preparing for relevant roles and interviews.

Every buyer receives these, whether or not they are later shortlisted or hired. The fee is {{fee}}, charged once, and nothing is added at checkout. The seller is {{legal_name}}, a Smith & Adams group company registered in {{jurisdiction}}. Your bank statement will show {{statement_descriptor}}.

Buying the package is not required to join the database or to take part in recruitment. It gives no preferential treatment, and it does not buy or guarantee an interview, a job offer, a visa or a placement in Portugal. Selection depends on available vacancies, employer requirements and your suitability.

## What we undertake to do

- Deliver the assessment online, at a time you choose.
- Deliver your skills report within {{report_days}} days of you completing the assessment.
- Deliver your CV and career recommendations on request once your report is ready. They are built only from information you have given us; nothing is added that you cannot support.
- Deliver the preliminary legal review once you have uploaded your passport or ID and any other documents asked for on your dashboard.
- Give you a decision on your application within {{response_days}} days, either way.
- Keep your profile in the recruitment database, free of charge, for as long as you choose to remain visible and within the retention period in the privacy policy.

## What you undertake to do

- Give accurate information about your identity, work history and qualifications.
- Sit the assessment yourself. Having somebody else sit it voids the result and the fee.
- Use one account. Duplicate applications are removed without refund.

## Fees you will never pay us

The optional package fee is the only amount {{brand}} charges a candidate. Our placement fee is paid by the employer. Nobody is authorised to ask you for money for a job, a visa, or to move your application forward, and any such request should be reported to us at {{report_email}}.

## When the fee is due

After the assessment, not before, and only if you want the package. Registering, completing your profile, sitting the assessment and being in the database cost nothing.

## Cancellation and refunds

Set out in full in the [refund policy](/refund-policy), which forms part of these terms. In short: a full refund within 14 days if you have paid and downloaded nothing, and none after you have downloaded the report, the CV or the career recommendations, because at that point the service has been delivered.

## Selection

Selection for a placement in Portugal is not guaranteed. Candidates who score above {{shortlist_score}} out of 10 in the assessment and meet the essential requirements of the role qualify for the recruitment shortlist, whether or not they bought the package. Hiring then depends on available vacancies, interviews and the required checks, and visa decisions are made only by the authorities. The [selection rules](/selection-rules) set out the process and our past results.

## Your information

Handled as described in the [privacy policy](/privacy). Scoring is automated; no decision affecting your application is taken by an automated system alone.

## Liability

We are responsible for delivering the assessment and the report as described. We are not responsible for an employer's hiring decision, for a visa decision taken by any government, or for losses arising from information you gave us that was not accurate.

## Governing law

These terms are governed by the law of {{jurisdiction}}, without affecting any right you have under the consumer law of your own country.

## Changes

We may change these terms. The terms that apply to you are the ones published when you paid, and we keep previous versions. Current version: {{consent_version}}.`,
      },
    ],
  ]),
};

export const PRIVACY: DefaultPage = {
  slug: 'privacy',
  path: '/privacy',
  title: 'Privacy policy',
  purpose: 'What personal data is collected, who sees it, where it is held and for how long.',
  seo: {
    title: 'Privacy policy',
    description: 'What we collect, who can see your profile, where your data is held, how long we keep it and how to exercise your rights.',
  },
  blocks: makeBlocks('privacy', [
    [
      'document',
      {
        title: 'Privacy policy',
        updated: '',
        body: `## Who holds your data

${ENTITY}

Placements in Portugal are made with our partner {{partner_name}}, {{partner_address}}, which receives a candidate's profile when they are considered for a job with a group company.

## What is collected

- Identity and contact details: name, mobile, email, city and state.
- Profile: role, years of experience, passport status, work abroad, previous visa refusals and family who would travel with you.
- Documents you upload, such as your passport or ID, for the preliminary legal review and the visa file.
- Assessment answers, scores and the resulting report.
- Payment records. Card details are never seen or stored by {{brand}}.

## Who can see a profile

Registering and appearing in our recruitment database is free. Once you have finished the assessment, recruiters at Smith & Adams group companies can see your role, city, English level, score and years of experience. Your name and contact details are released to an employer only with our approval, when they are considering you for a job. You can hide your profile at any time from your dashboard.

## Where data is held

All candidate data is stored in the European Union. Some of it is processed outside the EU by the services that send your email and WhatsApp messages and by the AI service that helps prepare your CV, under standard contractual clauses. Nothing is sold or shared for advertising.

## Automated decisions

Scoring is computed automatically. No selection, rejection or shortlisting decision is made by an automated system alone: a person reviews every decision that affects a candidate, and a candidate can ask for the reasoning behind any decision and contest it.

## Retention

Your data is kept for one year after your last application ends, or for one year from registration if you never apply, and is then deleted. Payment records are kept as tax law requires. You can ask for deletion sooner at any time.

## Your rights

Access, correction, deletion, a copy of your data, and withdrawal of consent. Write to our data protection contact, {{dpo_name}}, at {{dpo_email}}. You can also download your data from your dashboard.`,
      },
    ],
  ]),
};

export const REFUND_POLICY: DefaultPage = {
  slug: 'refund-policy',
  path: '/refund-policy',
  title: 'Refund policy',
  purpose: 'When and how a package buyer is refunded. Payment providers require it.',
  seo: {
    title: 'Refund policy',
    description: 'When you pay, when you can get your money back, and how to ask for a refund.',
  },
  blocks: makeBlocks('refund-policy', [
    [
      'document',
      {
        title: 'Refund policy',
        updated: '',
        body: `## When you pay

Only if you choose to. Registering, the assessment, your place in the recruitment database and applying to jobs are free. The Professional Assessment and Career Preparation Package is optional, gives no priority in selection, and is payable only when you want it.

## After you pay

The full report, the professionally prepared CV and the career recommendations are available to download the moment the payment clears. The preliminary legal review is prepared by our legal team once you have uploaded your passport or national ID, and appears on your dashboard when it is ready. The package is not refundable once you have downloaded any part of it, but the legal review is still owed to you.

## If you have paid and not downloaded anything

Write to us within 14 days and the full {{fee}}, including any VAT component, is refunded to the original payment method. Nothing has been delivered, so there is nothing to argue about.

## If we cancel a cohort

If a cohort is cancelled before assessments begin, every candidate is refunded in full. If it is cancelled after, every candidate still receives their report and profile.

## If we are late with your report

If we have not delivered your report within {{report_days}} days of you completing the assessment, and the delay is ours, you are entitled to a full refund even though you have started.

## How to request a refund

Write from the email address on the account to {{finance_email}}, or use the [contact page](/contact). We reply within two working days. Approved refunds are issued within 7 working days to the original payment method, including any VAT component; how long the money then takes to appear depends on your bank and the payment method used.

## Chargebacks

If you believe a charge is wrong, contact us before raising it with your bank. We would rather resolve it directly and faster than a chargeback takes.`,
      },
    ],
  ]),
};

export const SELECTION_RULES: DefaultPage = {
  slug: 'selection-rules',
  path: '/selection-rules',
  title: 'Selection rules',
  purpose: 'How candidates are shortlisted and what the optional package does and does not buy. Linked from the consent checkbox.',
  seo: {
    title: 'Selection rules',
    description: 'How the shortlist is decided, what is free, what the optional package buys and does not buy, and our past results.',
  },
  blocks: makeBlocks('selection-rules', [
    [
      'document',
      {
        title: 'Selection rules',
        updated: '',
        body: `## What is free

Registering, sitting the assessment and joining our recruitment database are free. With your consent, your profile is considered for current and future vacancies within the Smith & Adams group and participating partner companies.

## What the optional package buys

The Professional Assessment and Career Preparation Package: a personal skills and English report, a professionally prepared CV, a preliminary legal review of the documents you provide, and individual career recommendations. Every buyer receives all four, whether or not they are shortlisted or hired.

## What the package does not buy

It does not buy a job, a visa, a placement in Portugal, or any promise of one. It is not required to join the database or to take part in recruitment, it gives no preferential treatment, and it does not guarantee an interview or a job offer.

## How the shortlist is decided

- An assessment score above {{shortlist_score}} out of 10, and the essential requirements of the role. Whether you bought the package plays no part.
- A call with our recruiters, then a Zoom interview with the employer.
- Document and right-to-work checks.
- An offer, which depends on the vacancies open at the time.

Selection is on merit, not chance. Scores, interview notes and the reason for the final decision are kept and can be requested by the candidate.

## Our past results

Historically, an average of {{shortlist_hired}} out of every {{shortlist_size}} **shortlisted** candidates have been hired through our recruitment programme. That is out of those shortlisted, not out of everyone who applies: most applicants are not shortlisted. It reflects past results and does not guarantee any individual outcome.

{{outcome_basis}}

## Employer contact without selection

A profile that is visible can be found by vetted employers, who may invite the candidate to interview independently of the cohort placement. A candidate can hide their profile at any time from their dashboard.`,
      },
    ],
  ]),
};

export const DELIVERY: DefaultPage = {
  slug: 'delivery',
  path: '/delivery',
  title: 'Service delivery',
  purpose: 'How and when the package reaches the buyer. Payment providers ask for it in place of a shipping policy.',
  seo: {
    title: 'Service delivery',
    description: 'Everything sold here is delivered online. What arrives, when, and what happens if it does not.',
  },
  blocks: makeBlocks('delivery', [
    [
      'document',
      {
        title: 'Service delivery',
        updated: '',
        body: `Everything sold here is delivered online. Nothing is shipped and there are no delivery charges.

## What arrives, and when

- **Your skills report: within {{report_days}} days** of completing the assessment. It appears in your dashboard and can be downloaded as a PDF.
- **Your CV and career recommendations: on request, within minutes**, once your report is ready, from your dashboard.
- **Your preliminary legal review** once you have uploaded your passport or national ID and the documents your dashboard asks for.
- **Your database profile** stays available to vetted employers for {{profile_months}} months, free, whether or not you buy the package.
- **A decision on your application: within {{response_days}} days** of your application being complete, whether the answer is yes or no.

## How you receive it

Through your account on this site. We also message you at the email address and mobile number you registered when your report is ready.

## If something does not arrive

[Contact us](/contact). If we have not delivered the report within {{report_days}} days of you completing the assessment, and the delay is ours, you are entitled to a full refund even though you have started.`,
      },
    ],
  ]),
};

export const CONTACT: DefaultPage = {
  slug: 'contact',
  path: '/contact',
  title: 'Contact',
  purpose: 'The contact form, the registered office and the addresses for candidates, employers and scam reports.',
  seo: {
    title: 'Contact us',
    description: 'Write to us about a job, an application or the visa. Registered office, emails for candidates and employers, and how to report a scam.',
  },
  blocks: makeBlocks('contact', [
    [
      'contact_form',
      {
        title: 'Contact us',
        intro:
          'Questions about a job, an application or the visa, and reports of anyone asking you for money, all reach the same team. A person reads every message.',
      },
    ],
    [
      'document',
      {
        title: '',
        updated: '',
        body: `## Registered office

${ENTITY}

## Offices

{{offices}}

{{office_hours}}

## Candidates

{{support_email}}. We answer within two working days, and give a decision on an application within {{response_days}} days.

## Employers

{{employer_email}}

## If anyone asks you for money

Nobody is authorised to charge a candidate anything beyond the optional career package paid on this site. Not an agent, not an intermediary, not anyone claiming to represent us. If it happens, tell us at {{report_email}}. You can do it without giving your name, and it will not affect your application.`,
      },
    ],
  ]),
};

export const LEGAL_PAGES: DefaultPage[] = [TERMS, PRIVACY, REFUND_POLICY, SELECTION_RULES, DELIVERY, CONTACT];
