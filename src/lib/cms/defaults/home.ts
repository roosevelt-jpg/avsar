import { slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * Home — Careers in Portugal mockup shell.
 *
 * Photography is documentary (Lisbon streets, working kitchens, jobsites), not
 * posed AI stock collages. Hero is a full-bleed place slideshow with an
 * overlapping stats strip; Why Portugal uses real scene tiles; presence map,
 * journey and employer bands keep place/work stills.
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
        /* Full-bleed documentary slideshow; stats sit as a white strip on the lower edge. */
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: '/lisbon-rooftops-1200.jpg',
        mediaPoster: '',
        mediaAlt: 'Lisbon rooftops looking toward the Tagus and the 25 de Abril Bridge',
        slides: slidesWithCaptions([
          {
            src: '/lisbon-rooftops-1200.jpg',
            alt: 'Lisbon rooftops looking toward the Tagus and the 25 de Abril Bridge',
          },
          {
            src: '/kitchen-work-1400.jpg',
            alt: 'Kitchen team preparing food in a working restaurant kitchen',
          },
          {
            src: '/photos/brand/hero-construction.jpg',
            alt: 'Construction crew on a reinforced concrete site in Portugal',
          },
          {
            src: '/photos/brand/journey-tram-real.jpg',
            alt: 'Yellow Lisbon tram on a cobbled street',
          },
        ]),
        stats: [
          { value: '3', label: 'Countries in our corridor' },
          { value: '2', label: 'Offices — Lisbon & Dubai' },
          { value: '0', label: 'Placement fees for candidates' },
          { value: '1', label: 'Free profile to get started' },
        ],
      },
    ],
    [
      'presence_map',
      {
        eyebrow: 'Our footprint',
        title: 'India to Portugal, with UAE roots',
        intro:
          'We recruit in India, place people with employers in Portugal, and operate from offices in Lisbon and Dubai. Outcomes and visa decisions depend on the authorities.',
        hubLabel: 'India — talent source',
        hubNote: 'Candidates apply from India. We do not invent branch offices that are not listed in Settings.',
      },
    ],
    [
      'features',
      {
        eyebrow: 'Sectors we recruit for',
        title: 'Our Categories',
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
            image: '/photos/brand/hero-construction.jpg',
            link: { label: '', href: '' },
          },
          {
            icon: 'euro',
            title: 'Better Earnings',
            body: 'Competitive monthly pay with a written contract.',
            image: '/kitchen-work-1400.jpg',
            link: { label: '', href: '' },
          },
          {
            icon: 'home',
            title: 'High Quality of Life',
            body: 'Safe cities, family-friendly neighbourhoods, EU healthcare.',
            image: '/lisbon-rooftops-1200.jpg',
            link: { label: '', href: '' },
          },
          {
            icon: 'globe',
            title: 'EU Opportunities',
            body: 'Work and travel across the Schengen area after you settle.',
            image: '/photos/brand/journey-tram-real.jpg',
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
        sideImage: '/photos/brand/journey-tram-real.jpg',
        sideImageAlt: 'Yellow Lisbon tram on a cobbled street',
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
        imageAlt: 'Handshake after agreeing a hiring brief',
        cta: { label: 'Hire Talent', href: '/employers' },
      },
    ],
  ]),
};
