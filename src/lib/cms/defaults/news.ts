import { BRAND_SLIDES, INTRO_FILM, slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * News and insights linked from the footer. The public route also lists
 * editions staff send from Email subscribers; this CMS shell stays quiet
 * until there is something real to say — never staff-console instructions.
 */
export const NEWS_AND_INSIGHTS: DefaultPage = {
  slug: 'news-and-insights',
  path: '/news-and-insights',
  title: 'News and insights',
  purpose: 'Footer Company column. Admins publish updates from Email subscribers; the page does not invent articles.',
  seo: {
    title: 'News and insights · Portugal recruitment',
    description: 'Updates on recruiting from India to Portugal, visas and life at work — published by our team when there is something to say.',
  },
  blocks: makeBlocks('news', [
    [
      'hero',
      {
        eyebrow: 'News and insights',
        title: 'Updates on careers and life in Portugal',
        accentWord: 'Portugal',
        subtitle:
          'When we have a real update — hiring seasons, visa process notes, or life after arrival — it appears here. Until then this page stays quiet rather than filled with invented posts.',
        primaryCta: { label: 'Browse jobs', href: '/jobs' },
        secondaryCta: { label: 'Contact us', href: '/contact' },
        badgeLabel: 'From the team',
        badgeHref: '/news-and-insights',
        filmUrl: INTRO_FILM.url,
        filmLabel: INTRO_FILM.label,
        highlights: [],
        mediaType: 'image',
        mediaSrc: '/photos/lisbon.jpg',
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: 'Lisbon waterfront',
        slides: slidesWithCaptions(BRAND_SLIDES.portugal),
        stats: [],
      },
    ],
    [
      'rich_text',
      {
        title: 'Latest from the team',
        body: `We publish here when there is something concrete to share: hiring demand in a sector, a change to the visa checklist (always confirmed before publishing), or practical notes for candidates already on the path.

If you want those updates by email as well, leave your address in **Stay Connected** in the footer. Job openings and news letters go to that list.`,
      },
    ],
    [
      'notice',
      {
        tone: 'info',
        title: 'Prefer a person?',
        body: 'Questions about a live application belong on [Contact](/contact) or WhatsApp during office hours — not on a news page.',
      },
    ],
    [
      'cta',
      {
        title: 'See what is open now',
        body: 'The jobs board is live. Every posting shows salary, city and what is included.',
        primary: { label: 'Job opportunities', href: '/jobs' },
        secondary: { label: 'Why Portugal', href: '/why-portugal' },
      },
    ],
  ]),
};
