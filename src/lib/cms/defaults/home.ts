import { BRAND_SLIDES, INTRO_FILM, slidesWithCaptions } from '@/lib/cms/brand-media';
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
        eyebrow: 'India to Portugal · Verified opportunities',
        title: 'Build Your Career in Portugal',
        accentWord: 'Portugal',
        subtitle:
          'Trusted recruitment, legal employment and relocation support for skilled professionals from India. Create a free profile, take the free skills test, and apply to real jobs.',
        primaryCta: { label: 'Create my free profile', href: '/signup' },
        secondaryCta: { label: 'See open jobs', href: '/jobs' },
        badgeLabel: 'Work & Live in Portugal',
        badgeHref: '/why-portugal',
        filmUrl: INTRO_FILM.url,
        filmLabel: INTRO_FILM.label,
        highlights: [
          'Verified employers',
          'Legal contracts',
          'Visa and relocation support',
          'End-to-end guidance',
        ],
        intentsLabel: '',
        intents: [],
        bubbles: [],
        liveProof: true,
        routeMap: false,
        layout: 'split',
        mediaType: 'image',
        mediaSrc: '/photos/brand/hero-workers.jpg',
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: 'Skilled professionals ready to work in Portugal',
        slides: slidesWithCaptions(BRAND_SLIDES.careers),
        stats: [],
      },
    ],
    [
      'trust_bar',
      {
        items: [
          {
            icon: 'shield',
            title: 'Verified employers',
            body: 'Every job is confirmed with the Portuguese employer before it goes live.',
          },
          {
            icon: 'document',
            title: 'Legal contracts',
            body: 'A Portuguese employment contract, with salary paid 14 times a year.',
          },
          {
            icon: 'plane',
            title: 'Visa and relocation',
            body: 'We build your visa file with you and meet you when you land.',
          },
          {
            icon: 'users',
            title: 'End-to-end guidance',
            body: 'From the free test to your first weeks at work, a person stays with you.',
          },
        ],
      },
    ],
    [
      'press_bar',
      {
        eyebrow: 'As featured in',
        items: [],
      },
    ],
    [
      'features',
      {
        eyebrow: '',
        title: 'Why Portugal?',
        intro: '',
        columns: '4',
        style: 'icons',
        typing: false,
        items: [
          {
            icon: 'briefcase',
            title: 'Stable jobs',
            body: 'Growing demand across hospitality, trades, logistics and care.',
          },
          {
            icon: 'euro',
            title: 'Better earnings',
            body: 'Competitive pay under Portuguese law, with salary paid 14 times a year.',
          },
          {
            icon: 'home',
            title: 'High quality of life',
            body: 'Safe cities, public healthcare and a family-friendly place to settle.',
          },
          {
            icon: 'globe',
            title: 'EU opportunities',
            body: 'A work visa path that can open travel across the Schengen area.',
          },
        ],
      },
    ],
    [
      'steps',
      {
        eyebrow: 'A simple, transparent journey',
        title: 'From Application to Relocation',
        intro: 'Four clear stages. Your dashboard always shows which one you are on.',
        layout: 'journey',
        sideImage: '/photos/brand/journey-tram.jpg',
        sideImageAlt: 'A yellow Lisbon tram on a historic street',
        items: [
          {
            icon: 'users',
            title: 'Create profile',
            body: 'Tell us about your skills and experience. Free, from your phone.',
            meta: 'Free',
            image: '',
          },
          {
            icon: 'briefcase',
            title: 'Get matched',
            body: 'Take the free skills test. A score above {{shortlist_score}} out of 10 qualifies you for the shortlist.',
            meta: 'Free',
            image: '',
          },
          {
            icon: 'document',
            title: 'Visa and documents',
            body: 'After a successful offer, we prepare the visa file with you, document by document.',
            meta: 'After an offer',
            image: '',
          },
          {
            icon: 'plane',
            title: 'Relocate and work',
            body: 'Flight, housing and arrival support when you are selected. The employer pays the placement fee.',
            meta: 'Welcome',
            image: '',
          },
        ],
      },
    ],
    [
      'employer_band',
      {
        eyebrow: 'For employers',
        title: 'Hire skilled talent from India',
        body: 'Search a pool of pre-assessed candidates for your team in Portugal. We handle visas, relocation and onboarding.',
        bullets: [
          { icon: 'users', text: 'Pre-vetted candidates' },
          { icon: 'clock', text: 'Faster hiring process' },
          { icon: 'plane', text: 'Full relocation support' },
        ],
        image: '/photos/brand/employer-handshake.jpg',
        imageAlt: 'Employer and candidate shaking hands after a placement',
        cta: { label: 'Hire talent', href: '/employers' },
      },
    ],
    [
      'featured_jobs',
      {
        eyebrow: 'Open now',
        title: 'Jobs you can apply for today',
        intro:
          'Each posting shows the salary, the city, the housing and meals included and what the employer is looking for. No surprises later.',
        limit: 6,
        cta: { label: 'See all jobs', href: '/jobs' },
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
      'candidate_stories',
      {
        eyebrow: 'From people who made the move',
        title: 'In their own words',
        intro: 'Only stories written by candidates we placed and approved by our team appear here. Nothing is invented.',
        limit: 3,
      },
    ],
    [
      'faq',
      {
        eyebrow: 'Questions',
        title: 'Before you apply',
        intro: '',
        items: [
          {
            question: 'Is it free to apply?',
            answer:
              'Yes. Creating a profile and applying to jobs is free. There is no placement fee for candidates: the employer pays us when they hire.',
          },
          {
            question: 'Do I have to pay anything?',
            answer:
              'The account, the rewritten CV, the skills test, your score and applying are free. You can buy a skills report PDF ({{skills_fee}}) and a list of what is missing for the visa ({{visa_fee}}). Both together are {{bundle_fee}} instead of {{fee_inr}}. Neither changes the shortlist. The employer pays the placement fee.',
          },
          {
            question: 'Do I need to speak Portuguese?',
            answer:
              'No. Most of the jobs we recruit for need basic English. Many employers offer Portuguese lessons once you arrive.',
          },
          {
            question: 'How long does it take?',
            answer:
              'You hear back within {{response_days}} days of applying. From offer to arrival usually takes three to six months, mostly waiting for the visa.',
          },
          {
            question: 'Someone on WhatsApp asked me for money for a job here. Is that you?',
            answer:
              'No. We never ask for money by WhatsApp, bank transfer or cash. Read [how to stay safe](/stay-safe) and report it to us.',
          },
        ],
      },
    ],
  ]),
};
