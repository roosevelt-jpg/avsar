import { slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * Home — shopfront for candidates arriving from WhatsApp, Instagram or search.
 *
 * Documentary photography only (Lisbon, kitchens, jobsites). Sections are short,
 * specific and honest — no kit slogans, no invented office count.
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
        eyebrow: 'India → Portugal',
        title: 'Real jobs in Portugal for skilled people from India',
        accentWord: 'Portugal',
        subtitle:
          'Apply free on your phone. Verified Portuguese employers, written contracts, and visa support from application to arrival — no placement fee for candidates.',
        primaryCta: { label: 'Create free profile', href: '/signup' },
        secondaryCta: { label: 'See open jobs', href: '/jobs' },
        badgeLabel: 'How relocation works',
        badgeHref: '/why-portugal',
        filmUrl: '',
        filmLabel: '',
        highlights: [
          'Verified employers',
          'Written contracts',
          'Visa guidance',
          'No candidate placement fee',
        ],
        intentsLabel: '',
        intents: [],
        bubbles: [],
        liveProof: false,
        routeMap: false,
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
        eyebrow: 'Where we work',
        title: 'India to Portugal, with UAE roots',
        intro:
          'We recruit in India, place people with employers in Portugal, and operate from Lisbon and Dubai. Outcomes and visa decisions depend on the authorities.',
        hubLabel: 'India — talent source',
        hubNote: 'Candidates apply from India. We do not invent branch offices that are not listed in Settings.',
      },
    ],
    [
      'features',
      {
        eyebrow: 'Sectors',
        title: 'Roles we hire for',
        intro: 'Hospitality, care, trades, logistics and related skilled work with Portuguese employers.',
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
            body: 'Store and customer-service roles.',
            link: { label: 'See jobs', href: '/jobs' },
          },
          {
            icon: 'shield',
            title: 'Facilities & cleaning',
            body: 'Building services across Portugal.',
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
            title: 'Other roles',
            body: 'Employers can request other roles through the portal.',
            link: { label: 'All industries', href: '/industries' },
          },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: 'Life after the move',
        title: 'Why Portugal',
        intro: 'The places candidates actually move to — streets, kitchens and jobsites, not stock slogans.',
        columns: '4',
        style: 'tiles',
        typing: false,
        items: [
          {
            icon: 'briefcase',
            title: 'Steady demand',
            body: 'Hospitality, trades, care and logistics keep hiring.',
            image: '/photos/brand/hero-construction.jpg',
            link: { label: '', href: '' },
          },
          {
            icon: 'euro',
            title: 'Clear pay',
            body: 'Competitive monthly pay with a written contract.',
            image: '/kitchen-work-1400.jpg',
            link: { label: '', href: '' },
          },
          {
            icon: 'home',
            title: 'Liveable cities',
            body: 'Safe neighbourhoods and EU healthcare once you settle.',
            image: '/lisbon-rooftops-1200.jpg',
            link: { label: '', href: '' },
          },
          {
            icon: 'globe',
            title: 'EU mobility',
            body: 'Work and travel in Schengen after you are established.',
            image: '/photos/brand/journey-tram-real.jpg',
            link: { label: '', href: '' },
          },
        ],
      },
    ],
    [
      'steps',
      {
        eyebrow: 'How it works',
        title: 'From application to arrival',
        intro:
          'One path: profile, shortlist, documents, then travel and start work. We stay with you through each step.',
        layout: 'journey',
        sideImage: '/photos/brand/journey-tram-real.jpg',
        sideImageAlt: 'Yellow Lisbon tram on a tiled Alfama street',
        items: [
          {
            icon: 'users',
            title: 'Create a profile',
            body: 'Skills and experience, on your phone.',
            meta: '',
            image: '',
          },
          {
            icon: 'briefcase',
            title: 'Get matched',
            body: 'Shortlisted for verified openings.',
            meta: '',
            image: '',
          },
          {
            icon: 'document',
            title: 'Visa & documents',
            body: 'Guidance on the paperwork you need.',
            meta: '',
            image: '',
          },
          {
            icon: 'plane',
            title: 'Relocate & work',
            body: 'Travel, settle and start the job.',
            meta: '',
            image: '',
          },
        ],
      },
    ],
    [
      'featured_employers',
      {
        eyebrow: 'Employers',
        title: 'Companies that hire through us',
        cta: { label: 'For employers', href: '/employers' },
      },
    ],
    [
      'employer_band',
      {
        eyebrow: 'For employers',
        title: 'Hire skilled people from India',
        body: 'Pre-screened candidates for Portugal roles, with relocation support after you hire.',
        layout: 'home',
        bullets: [
          { icon: 'users', text: 'Pre-screened candidates' },
          { icon: 'clock', text: 'Faster shortlists' },
          { icon: 'plane', text: 'Relocation support' },
        ],
        image: '/photos/brand/employer-handshake.jpg',
        imageAlt: 'Handshake after agreeing a hiring brief',
        cta: { label: 'Hire talent', href: '/employers' },
      },
    ],
  ]),
};
