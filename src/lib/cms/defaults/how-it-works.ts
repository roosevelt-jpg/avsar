import { BRAND_SLIDES, INTRO_FILM, slidesWithCaptions } from '@/lib/cms/brand-media';
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
        title: 'Your Portugal career journey, step by step',
        accentWord: 'Portugal',
        subtitle:
          'No hidden stages and no surprise fees. Six clear stages from a free profile to your first month at work — with timings and who pays for what.',
        primaryCta: { label: 'Create free profile', href: '/signup' },
        secondaryCta: { label: 'Browse jobs', href: '/jobs' },
        badgeLabel: 'Six live stages',
        badgeHref: '/how-it-works',
        filmUrl: INTRO_FILM.url,
        filmLabel: INTRO_FILM.label,
        highlights: ['Free profile and test', 'Real job applications', 'Visa after a successful offer'],
        mediaType: 'image',
        mediaSrc: '/photos/steps/profile.jpg',
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: 'Creating a career profile',
        slides: slidesWithCaptions(BRAND_SLIDES.journey),
        stats: [],
      },
    ],
    [
      'steps',
      {
        eyebrow: 'The journey',
        title: 'Six steps from India to Portugal',
        intro: '',
        layout: 'journey',
        sideImage: '/photos/brand/journey-tram.jpg',
        sideImageAlt: 'A yellow Lisbon tram on a historic street',
        items: [
          {
            icon: 'users',
            title: '1. Create your free profile',
            body: 'Your name, mobile number, email and a password. You can come back and change the account and the CV. Nothing is needed up front.',
            meta: '2 minutes · free',
            image: '/photos/steps/profile.jpg',
          },
          {
            icon: 'document',
            title: '2. Rewrite your CV, then take the test',
            body: 'We rewrite your CV from what you wrote. Then the skills and English questions, up to 90 minutes, and you see your score. Both are free. A score above {{shortlist_score}} out of 10, plus the essential requirements of the role, qualifies you for the shortlist.',
            meta: 'On your phone · free',
            image: '/photos/steps/test.jpg',
          },
          {
            icon: 'briefcase',
            title: '3. Apply to jobs',
            body: 'Every job shows the salary, the city and what is included. Press apply and answer a few short questions. Apply to as many jobs as fit you; your assessment result goes with each application.',
            meta: '1 minute per job · free',
            image: '/photos/steps/apply.jpg',
          },
          {
            icon: 'phone',
            title: '4. Calls and interviews',
            body: 'A recruiter calls you first. If you are shortlisted, you interview with the employer on Zoom. Both calls are free. A contract comes only after a successful offer.',
            meta: 'Within {{response_days}} days',
            image: '/photos/steps/interview.jpg',
          },
          {
            icon: 'plane',
            title: '5. After a successful offer',
            body: 'A contract, housing, the flight and legal support come after a successful offer, not before. You receive a written offer and a {{contract_years}}-year employment contract to read before signing. Once you are selected we pay the visa fee, the police clearance certificate, immigration fees and taxes, and your flight. The employer pays the placement fee.',
            meta: '2 to 4 months',
            image: '/photos/steps/visa.jpg',
          },
          {
            icon: 'home',
            title: '6. Travel and settle in',
            body: 'Housing and meals are included with the job. We meet you, and stay with you through your first weeks: tax number, bank account, social security and health registration, and your residence permit appointment.',
            meta: 'First month',
            image: '/photos/steps/arrival.jpg',
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
          { icon: 'check', title: 'Applying and the database: free', body: 'Creating a profile, the rewritten CV, the assessment, your score, joining our recruitment database and applying to jobs are free, always.' },
          { icon: 'rupee', title: 'Two reports, if you want them', body: 'The skills report is {{skills_fee}}. The visa-requirements list is {{visa_fee}}. Both together are {{bundle_fee}} instead of {{fee_inr}}. Paid on this website, with a receipt. Buying does not change the shortlist.' },
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
      'live_funnel',
      {
        eyebrow: 'Honest odds',
        title: 'Where people actually get to',
        intro:
          'Counted live from our database, not typed in. Most people who take the test are not hired, and we would rather you knew that before you start.',
        completedLabel: 'finish the free test',
        qualifiedLabel: 'score above {{shortlist_score}} out of 10',
        shortlistedLabel: 'are put forward to an employer',
        hiredLabel: 'are hired',
        minSample: 50,
        pendingText:
          '{{finished}} people have finished the test so far. We will publish these rates here once {{min_sample}} have, because a rate from a handful of people misleads. Until then: historically about {{shortlist_hired}} of every {{shortlist_size}} shortlisted candidates have been hired.',
        note: 'The test is free, so taking it costs you nothing but time. Past results are not a promise.',
        cta: { label: 'How we select', href: '/selection-rules' },
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
