import { makeBlocks, type DefaultPage } from './make';

/**
 * The jobs board's own content: the band below the listing. The listing and
 * hero shell are live / Settings-driven. Search and filter labels live under
 * Settings › Jobs board.
 */
export const JOBS_INTRO: DefaultPage = {
  slug: 'jobs',
  path: '/jobs',
  title: 'Jobs board',
  purpose: 'Closer below the live jobs listing. Hero shell is Settings › Jobs board.',
  seo: {
    title: 'Open jobs in Portugal for Indian candidates',
    description:
      'Chef, cleaner, driver, electrician, welder and more. Salary and city shown on every job, housing and meals included. Free to apply.',
  },
  blocks: makeBlocks('jobs', [
    [
      'cta',
      {
        title: 'Don’t see your job yet?',
        body: 'Create your profile anyway. When a job that fits you opens, we will tell you first.',
        primary: { label: 'Create my free profile', href: '/signup' },
        secondary: { label: 'Ask us on WhatsApp', href: 'https://wa.me/{{whatsapp_digits}}' },
      },
    ],
  ]),
};
