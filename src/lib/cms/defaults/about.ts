import { BRAND_SLIDES, INTRO_FILM, slidesWithCaptions } from '@/lib/cms/brand-media';
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
        eyebrow: 'About us',
        title: 'Connecting global talent with opportunities in Portugal',
        accentWord: 'Portugal',
        subtitle:
          'Part of the Smith & Adams group. We recruit skilled people in India for verified employers in Portugal — fairly, with clear steps, and without placement fees for candidates.',
        primaryCta: { label: 'Find job opportunities', href: '/jobs' },
        secondaryCta: { label: 'For employers', href: '/employers' },
        badgeLabel: 'Smith & Adams group',
        badgeHref: '/about',
        filmUrl: INTRO_FILM.url,
        filmLabel: 'Watch our story · under a minute',
        highlights: ['Verified employers', 'Legal contracts', 'Visa support after offer', 'Honest selection'],
        mediaType: 'image',
        mediaSrc: '/photos/brand/hero-hospitality.jpg',
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: 'Lisbon and hospitality work in Portugal',
        slides: slidesWithCaptions(BRAND_SLIDES.about),
        stats: [],
      },
    ],
    [
      'live_funnel',
      {
        eyebrow: 'Live from our database',
        title: 'Where candidates actually get to',
        intro: 'Not a marketing scorecard. These counts update from real assessments and placements.',
        completedLabel: 'finish the free test',
        qualifiedLabel: 'score above {{shortlist_score}} out of 10',
        shortlistedLabel: 'are put forward to an employer',
        hiredLabel: 'are hired',
        minSample: 50,
        pendingText:
          '{{finished}} people have finished the test so far. We publish rates here once {{min_sample}} have finished, so a handful of results cannot mislead.',
        note: 'Past results are not a promise of a job.',
        cta: { label: 'How we select', href: '/selection-rules' },
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
      'features',
      {
        eyebrow: 'How we work',
        title: 'Core values we hold ourselves to',
        intro: 'Plain commitments — not marketing scores.',
        columns: '4',
        items: [
          { icon: 'users', title: 'People first', body: 'Candidates and employers sit at the centre of every decision.' },
          { icon: 'shield', title: 'Integrity', body: 'We say what a role pays, what it costs, and what we cannot promise.' },
          { icon: 'star', title: 'Excellence', body: 'Assessed candidates, confirmed vacancies, written contracts.' },
          { icon: 'heart', title: 'Partnership', body: 'Long-term relationships with employers who hire fairly.' },
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
        image: '/photos/brand/employer-handshake.jpg',
        imageAlt: 'Employer and candidate handshake',
        imageSide: 'right',
        gallery: BRAND_SLIDES.employers.slice(0, 4).map((slide) => ({ src: slide.src, alt: slide.alt })),
      },
    ],
    [
      'video',
      {
        eyebrow: 'Our story',
        title: 'See how the path to Portugal works',
        intro: 'Replace this film anytime in the CMS page editor.',
        src: INTRO_FILM.url,
        poster: INTRO_FILM.poster,
        caption: 'How recruitment from India to Portugal works',
      },
    ],
    [
      'cta',
      {
        title: 'Why work with S&A Recruitment?',
        body: 'Specialised India → Portugal hiring, verified employer network, end-to-end support after selection, and compliance-led visa preparation with independent lawyers.',
        primary: { label: 'Create free profile', href: '/signup' },
        secondary: { label: 'Contact us', href: '/contact' },
      },
    ],
    ['contact_cards', { eyebrow: 'Contact', title: 'Talk to us', intro: '' }],
  ]),
};
