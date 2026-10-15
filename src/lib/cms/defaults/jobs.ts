import { makeBlocks, type DefaultPage } from './make';

/**
 * The jobs board's own content: the intro above the listing and the band
 * below it. The listing itself is live data, not CMS.
 */
export const JOBS_INTRO: DefaultPage = {
  slug: 'jobs',
  path: '/jobs',
  title: 'Jobs board',
  purpose: 'Text above and below the live jobs listing.',
  seo: {
    title: 'Open jobs in Portugal for Indian candidates',
    description: 'Chef, cleaner, driver, electrician, welder and more. Salary and city shown on every job, housing and meals included. Free to apply.',
  },
  blocks: makeBlocks('jobs', [
    [
      'hero',
      {
        eyebrow: 'Open jobs',
        title: 'Find your job in Portugal',
        subtitle: 'Every job shows the salary and the city, and includes housing and meals. Applying is free and takes a minute.',
        primaryCta: { label: '', href: '' },
        secondaryCta: { label: '', href: '' },
        highlights: ['Free to apply', 'No placement fee', 'Visa support'],
        mediaType: 'none',
        mediaSrc: '',
        mediaPoster: '',
        mediaAlt: '',
        stats: [],
      },
    ],
    [
      'cta',
      {
        title: 'Don’t see your job yet?',
        body: 'Create your profile anyway. When a job that fits you opens, we will tell you first.',
        primary: { label: 'Create my profile', href: '/signup' },
        secondary: { label: 'Ask us on WhatsApp', href: 'https://wa.me/{{whatsapp_digits}}' },
      },
    ],
  ]),
};
