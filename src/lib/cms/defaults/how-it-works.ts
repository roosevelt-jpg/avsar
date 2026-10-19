import { makeBlocks, type DefaultPage } from './make';

export const HOW_IT_WORKS: DefaultPage = {
  slug: 'how-it-works',
  path: '/how-it-works',
  title: 'How it works',
  purpose: 'The full journey explained, for candidates who want to understand before they apply.',
  seo: {
    title: 'How it works · From application in India to work in Portugal',
    description: 'Every step from creating your profile to your first day at work in Portugal, with timings, what it costs and who does what.',
  },
  blocks: makeBlocks('how', [
    [
      'hero',
      {
        eyebrow: 'How it works',
        title: 'Every step, what it costs, and how long it takes.',
        subtitle:
          'No hidden stages and no surprise fees. This is the whole journey, from the moment you apply to your first month at work in Portugal.',
        primaryCta: { label: 'Browse jobs', href: '/jobs' },
        secondaryCta: { label: 'Read the FAQ', href: '/faq' },
        highlights: [],
        mediaType: 'image',
        mediaSrc: '/kitchen-work-1400.jpg',
        mediaPoster: '',
        mediaAlt: 'A cook plating food in a professional kitchen',
        stats: [],
      },
    ],
    [
      'steps',
      {
        eyebrow: 'The journey',
        title: 'Six steps from India to Portugal',
        intro: '',
        items: [
          {
            title: '1. Create your free profile',
            body: 'Your name, mobile number, email and a password. You can add your CV, a photo and a short voice introduction later from your dashboard. Nothing is needed up front.',
            meta: '2 minutes · free',
            image: '',
          },
          {
            title: '2. Take the skills and English assessment',
            body: 'Up to 90 minutes on your phone, in sections you can pause between. It checks job knowledge, experience and English. It is free, and finishing it puts you in our recruitment database. A score above {{shortlist_score}} out of 10, plus the essential requirements of the role, qualifies you for the shortlist.',
            meta: 'On your phone · free',
            image: '/walkthrough/assessment.jpg',
          },
          {
            title: '3. Apply to jobs',
            body: 'Every job shows the salary, the city and what is included. Press apply and answer a few short questions. Apply to as many jobs as fit you; your assessment result goes with each application.',
            meta: '1 minute per job · free',
            image: '',
          },
          {
            title: '4. Calls and interviews',
            body: 'A recruiter calls you to talk about your experience and answer your questions. If you are shortlisted, you interview with the employer on Zoom. We tell you what to expect and how to prepare.',
            meta: 'Within {{response_days}} days',
            image: '/walkthrough/call.jpg',
          },
          {
            title: '5. Offer, contract and visa',
            body: 'You receive a written offer and a {{contract_years}}-year employment contract to read before signing. The independent immigration lawyers we work with then prepare your work visa file with you. Once you are selected we pay the visa fee, the police clearance certificate, immigration fees and taxes, and your flight.',
            meta: '2 to 4 months',
            image: '/walkthrough/letter.jpg',
          },
          {
            title: '6. Travel and settle in',
            body: 'Housing and meals are included with the job. We meet you, and stay with you through your first weeks: tax number, bank account, social security and health registration, and your residence permit appointment.',
            meta: 'First month',
            image: '/walkthrough/documents.jpg',
          },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: 'What it costs',
        title: 'Clear about money from the start',
        intro: 'You should know exactly what you pay, to whom, and why, before you start.',
        columns: '3',
        items: [
          { icon: 'check', title: 'Applying and the database: free', body: 'Creating a profile, taking the assessment, joining our recruitment database and applying to jobs are free, always.' },
          { icon: 'rupee', title: 'Career package: {{fee_inr}}', body: 'Optional, and gives no priority. Led by a preliminary legal review of your documents for Portugal, then your full skills and English report, a professionally prepared CV, and career recommendations. Paid once on this website, with a receipt.' },
          { icon: 'briefcase', title: 'Placement: ₹0 for you', body: 'When you are hired, the employer pays our fee. You never pay a placement or "visa processing" fee to us.' },
        ],
      },
    ],
    [
      'notice',
      {
        tone: 'info',
        title: 'What we pay for once you are selected',
        body:
          'Your flight, the visa fee, the police clearance certificate, immigration fees and taxes, and legal advice from the independent immigration lawyers we work with. Housing and meals are included with the job. Before selection, getting a passport is your own cost. Nobody may ask you for money for a job or a visa: [report it](/stay-safe).',
      },
    ],
    [
      'stats',
      {
        eyebrow: 'Honest odds',
        title: 'How the shortlist works, and our past results',
        items: [
          { value: '{{shortlist_score}}/10', label: 'score to beat in the assessment', note: 'plus the role’s essential requirements' },
          { value: '0', label: 'priority from buying the package', note: 'the shortlist ignores it' },
          { value: '{{shortlist_hired}}/{{shortlist_size}}', label: 'shortlisted candidates hired, historically', note: 'past results, not a promise; most applicants are not shortlisted' },
        ],
      },
    ],
    [
      'cta',
      {
        title: 'Ready? It takes two minutes to start.',
        body: 'Create your profile and apply to the jobs that fit you.',
        primary: { label: 'See open jobs', href: '/jobs' },
        secondary: { label: 'Ask a question', href: 'https://wa.me/{{whatsapp_digits}}' },
      },
    ],
  ]),
};
