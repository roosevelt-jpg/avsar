import { makeBlocks, type DefaultPage } from './make';

export const HOME: DefaultPage = {
  slug: 'home',
  path: '',
  title: 'Home',
  purpose: 'The landing page. First impression for a candidate arriving from WhatsApp, Instagram or search.',
  seo: {
    title: 'Jobs in Portugal for Indian talent · Apply free from your phone',
    description:
      'Real jobs with Portuguese employers. Free to apply, no placement fees for candidates, UPI accepted, visa and relocation support from application to arrival.',
  },
  blocks: makeBlocks('home', [
    [
      'hero',
      {
        eyebrow: 'India → Portugal · Hiring now',
        title: 'Real jobs in Portugal. Apply from India in five minutes.',
        subtitle:
          'Chefs, cleaners, drivers, electricians, welders and more. Verified Portuguese employers, legal contracts, and a team that handles your visa and relocation with you, step by step.',
        primaryCta: { label: 'See open jobs', href: '/jobs' },
        secondaryCta: { label: 'How it works', href: '/how-it-works' },
        highlights: ['Free to apply', 'No placement fee for candidates', 'Track every step in your dashboard'],
        mediaType: 'video',
        mediaSrc: '/video/hero-loop.mp4',
        mediaPoster: '/video/hero-poster.jpg',
        mediaAlt: 'Kitchen team at work in a Portuguese hotel',
        stats: [
          { value: '5 min', label: 'to apply from your phone' },
          { value: '{{response_days}} days', label: 'to a clear answer, yes or no' },
          { value: '₹0', label: 'placement fee for candidates' },
        ],
      },
    ],
    [
      'trust_bar',
      {
        items: [
          { icon: 'shield', title: 'Verified employers', body: 'Every job is confirmed with the Portuguese employer before it goes live.' },
          { icon: 'rupee', title: 'Pay by UPI, on this site only', body: 'The one optional fee is the skills assessment, {{fee_inr}}. Never cash, never WhatsApp.' },
          { icon: 'document', title: 'Legal contracts', body: 'A Portuguese employment contract, with salary paid 14 times a year.' },
          { icon: 'plane', title: 'Visa and arrival', body: 'We build your visa file with you and meet you when you land.' },
        ],
      },
    ],
    [
      'featured_jobs',
      {
        eyebrow: 'Open now',
        title: 'Jobs you can apply for today',
        intro: 'Each posting shows the salary, the city, whether housing is included and what the employer is looking for. No surprises later.',
        limit: 6,
        cta: { label: 'See all jobs', href: '/jobs' },
      },
    ],
    [
      'steps',
      {
        eyebrow: 'How it works',
        title: 'From your phone in India to your first day in Portugal',
        intro: 'Six steps, and you always know which one you are on. Your dashboard shows it, and we message you when it moves.',
        items: [
          { title: 'Create your profile', body: 'Name, phone, email and a password. Two minutes, no documents needed yet.', meta: '2 minutes', image: '/walkthrough/register.jpg' },
          { title: 'Apply to a job', body: 'Pick a job and press apply. Answer two or three short questions about your experience.', meta: 'Free', image: '' },
          { title: 'Show your skills', body: 'A skills and English assessment on your phone, at a time that suits you. Employers see the result, so strong candidates stand out.', meta: 'From your phone', image: '/walkthrough/assessment.jpg' },
          { title: 'Talk to us, then the employer', body: 'A recruiter calls you first. Shortlisted candidates interview with the employer by video.', meta: 'Video call', image: '/walkthrough/call.jpg' },
          { title: 'Offer, contract and visa', body: 'You receive the offer letter and contract to read before you sign. Then we prepare your visa file with you.', meta: 'We guide you', image: '/walkthrough/letter.jpg' },
          { title: 'Fly and start work', body: 'We help with accommodation, your tax number, bank account and registration in the first weeks.', meta: 'Welcome', image: '/walkthrough/documents.jpg' },
        ],
      },
    ],
    [
      'job_categories',
      {
        eyebrow: 'Roles',
        title: 'The work we recruit for',
        intro: 'Hospitality, cleaning, trades, logistics and IT. Tap a role to see every open job in it.',
      },
    ],
    [
      'split',
      {
        eyebrow: 'If you are selected',
        title: 'What a job through us includes',
        body:
          'Every offer is a real Portuguese employment contract with the same rights as a Portuguese worker: minimum wage or above, paid leave, social security and public healthcare.\n\nWe stay with you after the offer, not just until it.',
        bullets: [
          'Employment contract, typically for {{contract_years}} years with renewal',
          'Salary paid 14 times a year, as Portuguese law requires',
          'Housing provided or arranged, depending on the job',
          'Your visa file prepared with you, and legal support through the residence permit',
          'Help getting your tax number (NIF), bank account and health registration',
        ],
        cta: { label: 'Visa and relocation, step by step', href: '/visa-and-relocation' },
        image: '/lisbon-rooftops-1200.jpg',
        imageAlt: 'Rooftops of Lisbon at sunset',
        imageSide: 'right',
      },
    ],
    [
      'features',
      {
        eyebrow: 'Made for you',
        title: 'Built for candidates applying from India',
        intro: '',
        columns: '3',
        items: [
          { icon: 'phone', title: 'Works on any phone', body: 'Light pages that load on mobile data. Apply, upload and track from the same phone.' },
          { icon: 'chat', title: 'A real person on WhatsApp', body: 'Questions answered by our team on {{whatsapp}}, in English or Hindi.' },
          { icon: 'clock', title: 'Track every step', body: 'Your dashboard shows each application, what stage it is at and what happens next.' },
          { icon: 'rupee', title: 'Pay the Indian way', body: 'UPI, RuPay and Indian net banking accepted for the assessment fee. A receipt every time.' },
          { icon: 'globe', title: 'In your language', body: 'The site works in English, Hindi, Malayalam, Tamil, Urdu and the other major languages of India. Switch language from the menu at the top.' },
          { icon: 'check', title: 'Honest odds', body: 'About {{hire_rate}} in 100 applicants are hired. We publish the numbers so you can decide with open eyes.' },
        ],
      },
    ],
    [
      'video',
      {
        eyebrow: 'Watch',
        title: 'See how it works in under a minute',
        intro: '',
        src: '/video/intro.mp4',
        poster: '/video/intro-poster.jpg',
        caption: 'The whole journey, from application to arrival.',
      },
    ],
    [
      'faq',
      {
        eyebrow: 'Questions',
        title: 'Before you apply',
        intro: '',
        items: [
          { question: 'Is it free to apply?', answer: 'Yes. Creating a profile and applying to jobs is free. There is no placement fee for candidates: the employer pays us when they hire.' },
          { question: 'What is the assessment fee for?', answer: 'The skills and English assessment gives you a personal report and gives employers a reason to pick you. It costs {{fee_inr}}, paid by UPI or card on this website. You can sit the assessment first and pay only to unlock your report.' },
          { question: 'Do I need to speak Portuguese?', answer: 'No. Most of the jobs we recruit for need basic English. Many employers offer Portuguese lessons once you arrive.' },
          { question: 'How long does it take?', answer: 'You hear back within {{response_days}} days of applying. From offer to arrival usually takes three to six months, mostly waiting for the visa.' },
          { question: 'Someone on WhatsApp asked me for money for a job here. Is that you?', answer: 'No. We never ask for money by WhatsApp, bank transfer or cash. Read [how to stay safe](/stay-safe) and report it to us.' },
        ],
      },
    ],
    [
      'cta',
      {
        title: 'Your next job could be in Lisbon, Porto or the Algarve.',
        body: 'Create your profile in two minutes and apply to any open job for free.',
        primary: { label: 'Find a job', href: '/jobs' },
        secondary: { label: 'Talk to us on WhatsApp', href: 'https://wa.me/{{whatsapp_digits}}' },
        tone: 'dark',
      },
    ],
  ]),
};
