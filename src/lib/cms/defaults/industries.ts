import { PHOTO_PORTO } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * Industries page from the HTML-44 public IA. Sectors employers hire for;
 * no invented placement counts.
 */
export const INDUSTRIES: DefaultPage = {
  slug: 'industries',
  path: '/industries',
  title: 'Industries',
  purpose: 'Sectors we recruit for between India and Portugal.',
  seo: {
    title: 'Industries · India to Portugal recruitment',
    description:
      'Hospitality, healthcare, construction, logistics and other sectors where we place skilled professionals in Portugal.',
  },
  blocks: makeBlocks('industries', [
    [
      'hero',
      {
        eyebrow: 'Industries',
        title: 'Sectors we recruit for',
        accentWord: '',
        subtitle:
          'We place skilled professionals from India with employers in Portugal across hospitality, healthcare, construction, logistics and related trades.',
        primaryCta: { label: 'Browse open jobs', href: '/jobs' },
        secondaryCta: { label: 'For employers', href: '/employers' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: '',
        filmLabel: '',
        highlights: [],
        layout: 'split',
        mediaType: 'image',
        mediaSrc: PHOTO_PORTO.src,
        mediaPoster: '',
        mediaAlt: PHOTO_PORTO.alt,
        slides: [],
        stats: [],
      },
    ],
    [
      'features',
      {
        eyebrow: 'Where we hire',
        title: 'Core sectors',
        intro: 'Open roles change with employer demand. Check the jobs board for what is live now.',
        columns: '3',
        typing: false,
        style: 'cards',
        items: [
          {
            icon: 'briefcase',
            title: 'Hospitality & hotels',
            body: 'Front office, kitchen, F&B and hotel operations roles with employers in Portugal.',
          },
          {
            icon: 'users',
            title: 'Healthcare support',
            body: 'Care and clinical support roles where Portuguese employers need trained staff.',
          },
          {
            icon: 'globe',
            title: 'Construction & trades',
            body: 'Skilled trades and site roles matched against verified experience.',
          },
          {
            icon: 'shield',
            title: 'Logistics & warehouses',
            body: 'Warehouse, driving and supply-chain roles with clear contracts.',
          },
          {
            icon: 'star',
            title: 'Retail & customer service',
            body: 'Store and service roles for candidates with strong people skills.',
          },
          {
            icon: 'document',
            title: 'More on request',
            body: 'Employers can request other roles through the employer portal.',
          },
        ],
      },
    ],
    [
      'cta',
      {
        title: 'Ready to apply or hire?',
        body: 'Candidates browse live jobs. Employers request vacancies through the employer portal.',
        primary: { label: 'Find jobs', href: '/jobs' },
        secondary: { label: 'Post a vacancy', href: '/employers/register' },
        style: 'band',
        image: '',
        imageAlt: '',
      },
    ],
  ]),
};
