import { slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * Home — Careers in Portugal mockup shell.
 *
 * Photography is documentary (Lisbon streets, working kitchens, jobsites), not
 * posed AI stock collages. Hero is one full-bleed place photo; Why Portugal
 * uses real scene tiles; the journey and employer bands keep place/work stills.
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
        /* Place-first full-bleed — one Lisbon street still, not a portrait carousel. */
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: '/photos/brand/hero-lisbon-street.jpg',
        mediaPoster: '',
        mediaAlt: 'A yellow tram on a steep Lisbon street',
        slides: slidesWithCaptions([
          {
            src: '/photos/brand/hero-lisbon-street.jpg',
            alt: 'A yellow tram on a steep Lisbon street',
          },
        ]),
        stats: [],
      },
    ],
    [
      'features',
      {
        eyebrow: 'Sectors we recruit for',
        title: 'Our Verticals',
        intro: 'Skilled roles with Portuguese employers — hospitality, care, trades, logistics and more.',
        columns: '4',
        style: 'verticals',
        typing: false,
        items: [
          {
            icon: 'briefcase',
            title: 'Hospitality & hotels',
            body: 'Front office, kitchen, F&B and hotel operations.',
            link: { label: 'See jobs', href: '/jobs' },
          },
          {
            icon: 'users',
            title: 'Healthcare support',
            body: 'Care and clinical support roles with written contracts.',
            link: { label: 'See jobs', href: '/jobs' },
          },
          {
            icon: 'home',
            title: 'Construction & trades',
            body: 'Skilled site and trade roles matched to verified experience.',
            link: { label: 'See jobs', href: '/jobs' },
          },
          {
            icon: 'globe',
            title: 'Logistics & warehouses',
            body: 'Warehouse, driving and supply-chain openings.',
            link: { label: 'See jobs', href: '/jobs' },
          },
          {
            icon: 'star',
            title: 'Retail & service',
            body: 'Store and customer-service roles for people-first candidates.',
            link: { label: 'See jobs', href: '/jobs' },
          },
          {
            icon: 'shield',
            title: 'Facilities & cleaning',
            body: 'Building services and facilities roles across Portugal.',
            link: { label: 'See jobs', href: '/jobs' },
          },
          {
            icon: 'euro',
            title: 'Food production',
            body: 'Kitchen and food-processing roles with clear pay terms.',
            link: { label: 'See jobs', href: '/jobs' },
          },
          {
            icon: 'document',
            title: 'More on request',
            body: 'Employers can request other roles through the portal.',
            link: { label: 'All industries', href: '/industries' },
          },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: '',
        title: 'Why Portugal?',
        intro: 'Real streets, real kitchens, real jobsites — the places candidates actually move to.',
        columns: '4',
        style: 'tiles',
        typing: false,
        items: [
          {
            icon: 'briefcase',
            title: 'Stable Jobs',
            body: 'Growing demand across hospitality, trades, care and logistics.',
            image: '/photos/brand/hero-jobsite.jpg',
            link: { label: '', href: '' },
          },
          {
            icon: 'euro',
            title: 'Better Earnings',
            body: 'Competitive monthly pay with a written contract.',
            image: '/photos/brand/hero-kitchen-work.jpg',
            link: { label: '', href: '' },
          },
          {
            icon: 'home',
            title: 'High Quality of Life',
            body: 'Safe cities, family-friendly neighbourhoods, EU healthcare.',
            image: '/photos/brand/hero-lisbon-street.jpg',
            link: { label: '', href: '' },
          },
          {
            icon: 'globe',
            title: 'EU Opportunities',
            body: 'Work and travel across the Schengen area after you settle.',
            image: '/photos/brand/journey-tram.jpg',
            link: { label: '', href: '' },
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
        image: '/photos/brand/employer-meeting.jpg',
        imageAlt: 'Hiring managers reviewing a placement together',
        cta: { label: 'Hire Talent', href: '/employers' },
      },
    ],
  ]),
};
