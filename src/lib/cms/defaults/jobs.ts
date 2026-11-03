import { BRAND_SLIDES, INTRO_FILM, slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * The jobs board's own content: the intro above the listing and the band
 * below it. The listing itself is live data, not CMS. Search and filter
 * labels live under Settings › Jobs board.
 */
export const JOBS_INTRO: DefaultPage = {
  slug: 'jobs',
  path: '/jobs',
  title: 'Jobs board',
  purpose: 'Text above and below the live jobs listing.',
  seo: {
    title: 'Open jobs in Portugal for Indian candidates',
    description:
      'Chef, cleaner, driver, electrician, welder and more. Salary and city shown on every job, housing and meals included. Free to apply.',
  },
  blocks: makeBlocks('jobs', [
    [
      'hero',
      {
        eyebrow: 'Job opportunities',
        title: 'Explore Verified Jobs in Portugal',
        accentWord: 'Portugal',
        subtitle:
          'Discover real, company-verified opportunities for skilled professionals from India. Apply free, get matched, and start your journey to work and live in Portugal.',
        primaryCta: { label: 'Create my free profile', href: '/signup' },
        secondaryCta: { label: 'How it works', href: '/how-it-works' },
        badgeLabel: 'Work & Live in Portugal',
        badgeHref: '/why-portugal',
        filmUrl: INTRO_FILM.url,
        filmLabel: INTRO_FILM.label,
        highlights: ['Salary shown on every job', 'Housing and meals when included', 'Free to apply'],
        intentsLabel: '',
        intents: [],
        bubbles: [],
        liveProof: false,
        routeMap: false,
        layout: 'split',
        mediaType: 'image',
        mediaSrc: '/photos/brand/jobs-hero-1.jpg',
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: 'A chef and a construction worker smiling in Portugal',
        slides: slidesWithCaptions(BRAND_SLIDES.jobs),
        stats: [],
      },
    ],
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
