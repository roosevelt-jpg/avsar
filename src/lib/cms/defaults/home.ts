import { BRAND_SLIDES, slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * Home — Careers in Portugal mockup shell.
 *
 * Only the sections on the mockup live here. Hero photograph, press names,
 * Why Portugal, journey steps and the employer band are editable in the CMS;
 * listing and funnel blocks stay off this page so the shell matches the design.
 */
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
        eyebrow: 'INDIA TO PORTUGAL | VERIFIED OPPORTUNITIES',
        title: 'Build Your Career in Portugal',
        accentWord: 'Portugal',
        subtitle:
          'Trusted recruitment, legal employment and relocation support for skilled professionals from India.',
        primaryCta: { label: 'Create Free Profile', href: '/signup' },
        secondaryCta: { label: 'Explore Jobs', href: '/jobs' },
        badgeLabel: 'Work & Live in Portugal',
        badgeHref: '/why-portugal',
        filmUrl: '',
        filmLabel: '',
        highlights: [
          'Verified Employers',
          'Legal Contracts',
          'Visa & Relocation Support',
          'End-to-End Guidance',
        ],
        intentsLabel: '',
        intents: [],
        bubbles: [],
        liveProof: false,
        routeMap: false,
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: '/photos/brand/hero-workers.jpg',
        mediaPoster: '',
        mediaAlt: 'Skilled professionals ready to work in Portugal',
        slides: slidesWithCaptions(BRAND_SLIDES.careers),
        stats: [],
      },
    ],
    [
      'press_bar',
      {
        eyebrow: 'As Featured In',
        items: [
          { name: 'Forbes', logo: '', href: '' },
          { name: 'Reuters', logo: '', href: '' },
          { name: 'Bloomberg', logo: '', href: '' },
          { name: 'EURACTIV', logo: '', href: '' },
          { name: 'The Economic Times', logo: '', href: '' },
        ],
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
            title: 'Stable Jobs',
            body: 'Growing demand across key industries.',
          },
          {
            icon: 'euro',
            title: 'Better Earnings',
            body: 'Competitive and fair salaries.',
          },
          {
            icon: 'home',
            title: 'High Quality of Life',
            body: 'Safe, modern and family-friendly.',
          },
          {
            icon: 'globe',
            title: 'EU Opportunities',
            body: 'Work and travel across the Schengen area.',
          },
        ],
      },
    ],
    [
      'steps',
      {
        eyebrow: 'A SIMPLE, TRANSPARENT JOURNEY',
        title: 'From Application to Relocation',
        intro:
          'We support you at every step — from finding the right opportunity to settling and starting your new life in Portugal.',
        layout: 'journey',
        sideImage: '/photos/brand/journey-tram.jpg',
        sideImageAlt: 'A yellow Lisbon tram on a historic street',
        items: [
          {
            icon: 'users',
            title: 'Create Profile',
            body: 'Tell us about your skills and experience.',
            meta: '',
            image: '',
          },
          {
            icon: 'briefcase',
            title: 'Get Matched',
            body: 'Be shortlisted for verified opportunities.',
            meta: '',
            image: '',
          },
          {
            icon: 'document',
            title: 'Visa & Documents',
            body: 'Receive guidance on all required paperwork.',
            meta: '',
            image: '',
          },
          {
            icon: 'plane',
            title: 'Relocate & Work',
            body: 'Travel, settle and start your new job in Portugal.',
            meta: '',
            image: '',
          },
        ],
      },
    ],
    [
      'employer_band',
      {
        eyebrow: 'FOR EMPLOYERS',
        title: 'Hire Skilled Talent from India',
        body: 'Access a pool of pre-screened, job-ready professionals for your business in Portugal.',
        layout: 'home',
        bullets: [
          { icon: 'users', text: 'Pre-vetted candidates' },
          { icon: 'clock', text: 'Faster hiring process' },
          { icon: 'plane', text: 'Full relocation support' },
        ],
        image: '/photos/brand/employer-handshake.jpg',
        imageAlt: 'Employer and candidate shaking hands after a placement',
        cta: { label: 'Hire Talent', href: '/employers' },
      },
    ],
  ]),
};
