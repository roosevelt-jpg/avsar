import { BRAND_SLIDES, INTRO_FILM, PHOTO_LISBON, PHOTO_PORTO, PHOTO_TRAM, slidesWithCaptions } from '@/lib/cms/brand-media';
import { makeBlocks, type DefaultPage } from './make';

/**
 * Why Portugal — shell from the “Start Your Portugal Career Journey” mockup
 * (Why Portugal active nav). Layout matches the PNG; no invented job counts
 * or satisfaction rates. Sector labels match roles we actually recruit for.
 */
export const WHY_PORTUGAL: DefaultPage = {
  slug: 'why-portugal',
  path: '/why-portugal',
  title: 'Why Portugal',
  purpose: 'Life and work in Portugal, for candidates comparing it with the Gulf, the UK or Canada.',
  seo: {
    title: 'Why work in Portugal · Salary, rights and life for Indian workers',
    description:
      'What working in Portugal really means: contracts, 14 salary payments a year, paid leave, healthcare, the cost of living, and the Indian community already there.',
  },
  blocks: makeBlocks('why', [
    [
      'hero',
      {
        eyebrow: 'Why Portugal',
        title: 'Build Your Career and a Better Life in Portugal',
        accentWord: 'Portugal',
        subtitle:
          'Join a growing community of international professionals enjoying great jobs, safety, quality of life, and long-term opportunities in Europe.',
        primaryCta: { label: 'Explore Job Opportunities', href: '/jobs' },
        secondaryCta: { label: '', href: '' },
        badgeLabel: '',
        badgeHref: '',
        filmUrl: INTRO_FILM.url,
        filmLabel: 'Watch: Life in Portugal',
        highlights: [],
        layout: 'overlay',
        mediaType: 'image',
        mediaSrc: PHOTO_LISBON.src,
        mediaPoster: INTRO_FILM.poster,
        mediaAlt: PHOTO_LISBON.alt,
        slides: slidesWithCaptions(BRAND_SLIDES.portugal),
        stats: [],
      },
    ],
    [
      'trust_bar',
      {
        style: 'stats',
        items: [
          { icon: 'briefcase', title: 'Growing Job Market Across Key Sectors', body: '' },
          { icon: 'heart', title: 'High Quality of Life', body: '' },
          { icon: 'shield', title: 'Safe & Welcoming Environment', body: '' },
          { icon: 'globe', title: 'Gateway to Europe (EU)', body: '' },
          { icon: 'home', title: 'Path to Long-Term Residency', body: '' },
        ],
      },
    ],
    [
      'split',
      {
        eyebrow: '',
        title: 'Why Professionals Choose Portugal',
        body: '',
        bullets: [
          'Diverse career opportunities in sectors like hospitality, construction, logistics, healthcare and more.',
          'Competitive and fair salaries with EU labour protection.',
          'Affordable cost of living compared to many EU countries.',
          'Excellent healthcare, education and public services.',
          'A warm, multicultural and family-friendly environment.',
          'Opportunity for long-term residency and a future in Europe.',
        ],
        cta: { label: '', href: '' },
        image: PHOTO_TRAM.src,
        imageAlt: PHOTO_TRAM.alt,
        imageSide: 'left',
        style: 'stacked',
        gallery: [
          { src: PHOTO_TRAM.src, alt: PHOTO_TRAM.alt },
          { src: PHOTO_PORTO.src, alt: PHOTO_PORTO.alt },
        ],
      },
    ],
    [
      'features',
      {
        eyebrow: '',
        title: 'In-Demand Sectors in Portugal',
        intro: '',
        columns: '4',
        style: 'sector_cards',
        sideImage: '',
        sideImageAlt: '',
        checklistTitle: '',
        checklist: [],
        typing: false,
        items: [
          { icon: 'home', title: 'Hospitality & Tourism', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'briefcase', title: 'Construction & Infrastructure', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'plane', title: 'Logistics & Supply Chain', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'heart', title: 'Healthcare & Caregiving', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'document', title: 'Manufacturing & Production', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'star', title: 'Agriculture & Food Processing', body: '', link: { label: '', href: '' }, image: '' },
          { icon: 'users', title: 'Other Skilled Roles', body: '', link: { label: '', href: '' }, image: '' },
        ],
      },
    ],
    [
      'cta',
      {
        title: 'Ready to Start Your Journey to Portugal?',
        body: 'Create your free profile today, take the skills test, and get matched with verified job opportunities.',
        primary: { label: 'Create Free Profile', href: '/signup' },
        secondary: { label: '', href: '' },
        style: 'banner',
        image: PHOTO_LISBON.src,
        imageAlt: PHOTO_LISBON.alt,
      },
    ],
  ]),
};
