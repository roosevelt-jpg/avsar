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
            title: '2. Apply to jobs',
            body: 'Every job shows the salary, the city, housing and what the employer wants. Press apply and answer a few short questions. Apply to as many jobs as fit you.',
            meta: '1 minute per job · free',
            image: '',
          },
          {
            title: '3. Take the skills and English assessment',
            body: 'About 90 minutes on your phone, in sections you can pause between. It checks job knowledge, experience and English. Employers see your scores, which is how strong candidates get noticed. You see your score on screen for free; the full report costs {{fee_inr}}.',
            meta: 'On your phone · optional',
            image: '/walkthrough/assessment.jpg',
          },
          {
            title: '4. Calls and interviews',
            body: 'A recruiter calls you to talk about your experience and answer your questions. If the employer shortlists you, you interview with them by video. We tell you what to expect and how to prepare.',
            meta: 'Within {{response_days}} days',
            image: '/walkthrough/call.jpg',
          },
          {
            title: '5. Offer, contract and visa',
            body: 'You receive a written offer and the employment contract to read before signing. We then prepare your work visa application with you: the document checklist, the appointment at the visa centre, and every form.',
            meta: '2 to 4 months',
            image: '/walkthrough/letter.jpg',
          },
          {
            title: '6. Travel and settle in',
            body: 'We confirm your arrival, help with accommodation and stay with you through your first weeks: tax number, bank account, social security and health registration, and your residence permit appointment.',
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
          { icon: 'check', title: 'Applying: free', body: 'Creating a profile and applying to jobs is free, always.' },
          { icon: 'rupee', title: 'Assessment report: {{fee_inr}}', body: 'Optional. Paid once by UPI, card or net banking on this website, with a receipt. Refundable in full if you cancel before you start.' },
          { icon: 'briefcase', title: 'Placement: ₹0 for you', body: 'When you are hired, the employer pays our fee. You never pay a placement or "visa processing" fee to us.' },
        ],
      },
    ],
    [
      'notice',
      {
        tone: 'info',
        title: 'Costs you will have that are not ours',
        body:
          'Some costs are part of moving to any country and are paid directly to the authority or company, never to us: your passport, the visa fee and visa centre service charge, a police clearance certificate, travel insurance for the visa, and your flight unless the employer covers it. Each job posting says what the employer pays for.',
      },
    ],
    [
      'stats',
      {
        eyebrow: 'Honest odds',
        title: 'Out of every 100 people who apply',
        items: [
          { value: '{{funnel_call}}', label: 'reach a call with a recruiter', note: 'after the assessment' },
          { value: '{{funnel_presented}}', label: 'are presented to an employer', note: 'the strongest match for each role' },
          { value: '{{hire_rate}}', label: 'receive a job offer', note: 'and go on to the visa stage' },
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
        tone: 'accent',
      },
    ],
  ]),
};
