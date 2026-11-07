import { BRAND_SLIDES, INTRO_FILM, PHOTO_LISBON, PHOTO_PORTO, PHOTO_TRAM, slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * How it works — “Your Portugal Career Journey Begins” mockup shell.
 *
 * Layout matches the PNG. Mockup stats (1,200+, 98%, 30–45 days) are not
 * shipped; labels stay honest. Process copy matches the five mockup steps.
 */
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
        title: 'Your Journey from Application to Employment in Portugal',
        accentWord: 'Portugal',
        subtitle:
          'A simple, transparent and fully supported process to help you get a verified job, visa and start your new life in Portugal.',
        primaryCta: { label: 'Create Free Profile', href: '/signup' },
        secondaryCta: { label: '', href: '' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: INTRO_FILM.url,
        filmLabel: 'Watch the Process',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: PHOTO_PORTO.src,
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: PHOTO_PORTO.alt,
        slides: slidesWithCaptions(BRAND_SLIDES.journey),
        stats: [],
      },
    ],
    [
      'trust_bar',
      {
        style: 'stats',
        /* Labels only — mockup figures are not invented here. */
        items: [
          { icon: 'users', title: 'Candidates Placed', body: '' },
          { icon: 'briefcase', title: 'Industry Sectors', body: '' },
          { icon: 'shield', title: 'Fair Selection Process', body: '' },
          { icon: 'clock', title: 'Clear Hiring Timeline', body: '' },
        ],
      },
    ],
    [
      'steps',
      {
        eyebrow: '',
        title: 'A Simple 5-Step Process',
        intro: 'From creating your profile to starting your job in Portugal — here’s how it works.',
        layout: 'process',
        sideImage: '',
        sideImageAlt: '',
        sideImageCaption: '',
        sideImageSide: 'left',
        items: [
          {
            icon: 'document',
            title: 'Create Your Profile',
            body: 'Sign up, complete your profile and upload your CV.',
            meta: '',
            image: '',
          },
          {
            icon: 'star',
            title: 'Take a Skills Test',
            body: 'Showcase your abilities with a short, role-based assessment.',
            meta: '',
            image: '',
          },
          {
            icon: 'users',
            title: 'Get Shortlisted',
            body: 'Our team reviews your profile and matches you with verified employers.',
            meta: '',
            image: '',
          },
          {
            icon: 'plane',
            title: 'Visa & Relocation Support',
            body: 'We guide you through visa, documentation and travel arrangements.',
            meta: '',
            image: '',
          },
          {
            icon: 'briefcase',
            title: 'Start Your Job in Portugal',
            body: 'Relocate, join your new employer and build your career.',
            meta: '',
            image: '',
          },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: '',
        title: 'We Support You Every Step of the Way',
        intro: '',
        columns: '2',
        style: 'support_grid',
        sideImage: PHOTO_TRAM.src,
        sideImageAlt: PHOTO_TRAM.alt,
        checklistTitle: '',
        checklist: [],
        typing: false,
        items: [
          {
            icon: 'check',
            title: 'Verified Job Opportunities',
            body: 'Only genuine and approved employers.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'phone',
            title: 'Dedicated Support',
            body: 'Guidance from application to relocation.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'plane',
            title: 'Relocation Assistance',
            body: 'Travel, accommodation and onboarding support.',
            link: { label: '', href: '' },
            image: '',
          },
          {
            icon: 'shield',
            title: 'Legal & Visa Compliance',
            body: 'Full support with documentation and work permits.',
            link: { label: '', href: '' },
            image: '',
          },
        ],
      },
    ],
    [
      'cta',
      {
        title: 'Ready to Start Your Journey?',
        body: 'Create your free profile today and get matched with real job opportunities in Portugal.',
        primary: { label: 'Create Free Profile', href: '/signup' },
        secondary: { label: '', href: '' },
        style: 'banner',
        image: PHOTO_LISBON.src,
        imageAlt: PHOTO_LISBON.alt,
      },
    ],
  ]),
};
