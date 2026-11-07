import { BRAND_SLIDES, INTRO_FILM, PHOTO_KITCHEN, PHOTO_LISBON, PHOTO_TRAM, slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * About page — “Connecting Talent to Portugal” mockup shell.
 *
 * Layout matches the uploaded PNG. Copy stays honest: no invented placement
 * counts, satisfaction percentages or press claims. Film and photographs are
 * editable in the CMS; phones and emails stay in Settings.
 */
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
        title: 'Connecting Global Talent with Opportunities in Portugal',
        accentWord: 'Portugal',
        subtitle:
          'S&A Recruitment is a specialist international agency connecting skilled professionals from India with trusted employers in Portugal — fairly, with clear steps, and without placement fees for candidates.',
        primaryCta: { label: 'Find Job Opportunities', href: '/jobs' },
        secondaryCta: { label: '', href: '' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: INTRO_FILM.url,
        filmLabel: 'Watch Our Story',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: PHOTO_LISBON.src,
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: PHOTO_LISBON.alt,
        slides: slidesWithCaptions(BRAND_SLIDES.about),
        stats: [],
      },
    ],
    [
      'trust_bar',
      {
        style: 'stats',
        items: [
          /* Labels only — mockup numbers (1,200+, 98%) are not shipped. */
          { icon: 'users', title: 'Professionals Placed', body: '' },
          { icon: 'briefcase', title: 'Partner Employers', body: '' },
          { icon: 'star', title: 'Industry Sectors', body: '' },
          { icon: 'globe', title: 'India ↔ Portugal Talent Bridge', body: '' },
          { icon: 'shield', title: 'Fair Selection Process', body: '' },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: '',
        title: '',
        intro: '',
        columns: '2',
        style: 'mission',
        sideImage: PHOTO_KITCHEN.src,
        sideImageAlt: PHOTO_KITCHEN.alt,
        typing: false,
        items: [
          {
            icon: 'map',
            title: 'Our Mission',
            body: 'Create clear, legal career paths from India to Portugal — assessed candidates, confirmed jobs, and support from application through the first months after arrival.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'star',
            title: 'Our Vision',
            body: 'Be the recruitment partner European employers trust for skilled talent from India, and the one candidates trust for honest steps and written contracts.',
            link: { label: '', href: '' },
            image: '',
          },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: '',
        title: 'Our Core Values',
        intro: '',
        columns: '4',
        style: 'value_cards',
        sideImage: '',
        sideImageAlt: '',
        typing: false,
        items: [
          {
            icon: 'users',
            title: 'People First',
            body: 'Candidates and employers sit at the centre of every decision we take.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'shield',
            title: 'Integrity',
            body: 'We say what a role pays, what it costs, and what we cannot promise.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'star',
            title: 'Excellence',
            body: 'Assessed candidates, confirmed vacancies and written Portuguese contracts.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'heart',
            title: 'Partnership',
            body: 'Long-term relationships with employers who hire fairly and stay with us.',
            link: { label: '', href: '' },
            image: '',
          },
        ],
      },
    ],
    [
      'employer_band',
      {
        eyebrow: '',
        title: 'Why Choose S&A Recruitment?',
        body: 'Whether you are a candidate or an employer, we are here to help you work toward a clear outcome in Portugal.',
        layout: 'why',
        bullets: [
          { icon: 'check', text: 'Specialised in Portugal recruitment from India.' },
          { icon: 'check', text: 'Trusted and verified employer network.' },
          { icon: 'check', text: 'End-to-end support: from application to relocation.' },
          { icon: 'check', text: 'Compliance with international recruitment standards.' },
          { icon: 'check', text: 'A dedicated team committed to your success.' },
        ],
        image: PHOTO_TRAM.src,
        imageAlt: PHOTO_TRAM.alt,
        cta: { label: 'Work With Us Today', href: '/signup' },
      },
    ],
  ]),
};
