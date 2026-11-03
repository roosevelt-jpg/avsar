import { BRAND_SLIDES, INTRO_FILM, slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * Stories from people we placed. The candidate_stories block only shows
 * entries approved in the console — nothing is invented here.
 */
export const SUCCESS_STORIES: DefaultPage = {
  slug: 'success-stories',
  path: '/success-stories',
  title: 'Success stories',
  purpose: 'Approved candidate stories for the footer Company column. Empty until real stories are published.',
  seo: {
    title: 'Success stories · India to Portugal careers',
    description: 'Stories from candidates we placed in Portugal, published only with their approval.',
  },
  blocks: makeBlocks('stories', [
    [
      'hero',
      {
        eyebrow: 'Success stories',
        title: 'In their own words, after the move to Portugal',
        accentWord: 'Portugal',
        subtitle:
          'Only stories written by candidates we placed and approved by our team appear here. If the list below is empty, we have not published one yet — we will not invent quotes.',
        primaryCta: { label: 'See open jobs', href: '/jobs' },
        secondaryCta: { label: 'Create free profile', href: '/signup' },
        badgeLabel: 'Real placements only',
        badgeHref: '/success-stories',
        filmUrl: INTRO_FILM.url,
        filmLabel: INTRO_FILM.label,
        highlights: ['Approved by our team', 'No invented testimonials', 'Linked from the site footer'],
        mediaType: 'image',
        mediaSrc: '/photos/brand/hero-workers.jpg',
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: 'Professionals who moved to Portugal for work',
        slides: slidesWithCaptions(BRAND_SLIDES.about),
        stats: [],
      },
    ],
    [
      'candidate_stories',
      {
        eyebrow: 'From people who made the move',
        title: 'Published stories',
        intro: 'These come from the stories queue in the console. Admins approve each one before it appears.',
        limit: 12,
      },
    ],
    [
      'notice',
      {
        tone: 'info',
        title: 'Want to share your story?',
        body: 'If we placed you and you want your experience on this page, write to us from [Contact](/contact). We only publish with your written permission.',
      },
    ],
    [
      'cta',
      {
        title: 'Ready to start your own journey?',
        body: 'Create a free profile and apply to verified jobs in Portugal.',
        primary: { label: 'Create free profile', href: '/signup' },
        secondary: { label: 'How it works', href: '/how-it-works' },
      },
    ],
  ]),
};
