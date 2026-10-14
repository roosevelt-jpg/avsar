import { makeBlocks, type DefaultPage } from './make';

export const ABOUT: DefaultPage = {
  slug: 'about',
  path: '/about',
  title: 'About us',
  purpose: 'Who is behind the platform. Candidates and their families check this before trusting a recruiter abroad.',
  seo: {
    title: 'About us · Recruitment from India to Portugal',
    description: 'Who we are, how we work with employers in Portugal, and the promises we make to every candidate.',
  },
  blocks: makeBlocks('about', [
    [
      'hero',
      {
        eyebrow: 'About {{brand}}',
        title: 'We connect skilled people in India with employers in Portugal who need them.',
        subtitle:
          'Part of the Smith & Adams group. We recruit fairly, tell candidates the truth about their chances, and stay with them until they are settled at work.',
        primaryCta: { label: 'See open jobs', href: '/jobs' },
        secondaryCta: { label: 'For employers', href: '/employers' },
        highlights: [],
        mediaType: 'image',
        mediaSrc: '/lisbon-rooftops-1200.jpg',
        mediaPoster: '',
        mediaAlt: 'Lisbon',
        stats: [],
      },
    ],
    [
      'features',
      {
        eyebrow: 'Our promises',
        title: 'What every candidate can expect from us',
        intro: '',
        columns: '3',
        items: [
          { icon: 'check', title: 'An answer, always', body: 'Yes or no within {{response_days}} days. Nobody is left waiting without news.' },
          { icon: 'rupee', title: 'No fees for being hired', body: 'Employers pay for recruitment. Candidates never pay a placement fee.' },
          { icon: 'document', title: 'Real jobs, real contracts', body: 'We publish a job only after confirming it with the employer.' },
          { icon: 'users', title: 'Fair selection', body: 'Everyone takes the same assessment. Selection is on skills and experience, nothing else.' },
          { icon: 'shield', title: 'Your data, protected', body: 'Your profile is shown to employers only while you choose to be visible.' },
          { icon: 'heart', title: 'Support after arrival', body: 'Your recruiter stays your contact through your first months in Portugal.' },
        ],
      },
    ],
    [
      'split',
      {
        eyebrow: 'Employers',
        title: 'Who we recruit for',
        body:
          'Hotels and resorts, restaurant groups, cleaning and facilities companies, construction and engineering contractors, logistics firms and technology companies across Portugal. They come to us because our candidates arrive assessed, prepared and supported.',
        bullets: [],
        cta: { label: 'Hiring? Talk to us', href: '/employers' },
        image: '/kitchen-work-1400.jpg',
        imageAlt: 'Kitchen team at work',
        imageSide: 'right',
      },
    ],
    ['contact_cards', { eyebrow: 'Contact', title: 'Talk to us', intro: '' }],
  ]),
};
