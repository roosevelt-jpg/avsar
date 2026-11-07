/**
 * Shared photographs and the intro film for marketing heroes.
 *
 * Paths live under `public/` so the CMS media picker and Settings forms can
 * keep or replace them later. Defaults import these packs so every shopfront
 * page ships a real slideshow instead of a single static frame.
 *
 * Prefer documentary place/work stills (Lisbon, Porto, kitchens, jobsites).
 * Do not use `/photos/lisbon.jpg` — that file is Madrid Gran Vía, not Portugal.
 */

export type BrandSlide = { src: string; alt: string; caption?: string };

/** Click-to-play film used on candidate heroes when Settings do not override. */
export const INTRO_FILM = {
  url: '/video/intro.mp4',
  poster: '/video/intro-poster.jpg',
  label: 'Watch how it works · under a minute',
} as const;

/** Soft ambient loop admins can also attach as a hero mediaSrc (video). */
export const HERO_LOOP = {
  url: '/video/hero-loop.mp4',
  poster: '/video/hero-poster.jpg',
} as const;

/** Real Portugal place photo — rooftops, Tagus, 25 de Abril Bridge. */
export const PHOTO_LISBON = {
  src: '/lisbon-rooftops-1200.jpg',
  alt: 'Lisbon rooftops looking toward the Tagus and the 25 de Abril Bridge',
} as const;

/** Working kitchen crew — candid hospitality still. */
export const PHOTO_KITCHEN = {
  src: '/kitchen-work-1400.jpg',
  alt: 'Kitchen team preparing food in a working restaurant kitchen',
} as const;

/** Construction site in Portugal. */
export const PHOTO_SITE = {
  src: '/photos/brand/hero-construction.jpg',
  alt: 'Construction crew on a reinforced concrete site in Portugal',
} as const;

/** Lisbon tram on cobbles. */
export const PHOTO_TRAM = {
  src: '/photos/brand/journey-tram-real.jpg',
  alt: 'Yellow Lisbon tram on a cobbled street',
} as const;

/** Porto Ribeira waterfront — Portugal place photo (not Lisbon). */
export const PHOTO_PORTO = {
  src: '/photos/brand/dash-banner.jpg',
  alt: 'Porto Ribeira waterfront and Rabelo boats on the Douro',
} as const;

export const BRAND_SLIDES = {
  /* Documentary place/work stills — avoid posed AI portrait collages on heroes. */
  careers: [PHOTO_LISBON, PHOTO_KITCHEN, PHOTO_SITE, PHOTO_TRAM],
  jobs: [
    PHOTO_KITCHEN,
    { src: '/photos/brand/hero-jobsite.jpg', alt: 'Workers tying rebar on a Portuguese building site' },
    { src: '/photos/brand/hero-service-floor.jpg', alt: 'Plated dish on a restaurant service floor in Portugal' },
    PHOTO_PORTO,
    PHOTO_TRAM,
  ],
  journey: [
    PHOTO_KITCHEN,
    PHOTO_SITE,
    { src: '/photos/documents.jpg', alt: 'Checking documents for a work visa' },
    { src: '/photos/selected/flight.jpg', alt: 'Flight to Portugal after selection' },
    PHOTO_TRAM,
    PHOTO_LISBON,
  ],
  portugal: [
    PHOTO_LISBON,
    PHOTO_PORTO,
    PHOTO_TRAM,
    { src: '/photos/brand/hero-hospitality.jpg', alt: 'Restaurant dining room in Portugal' },
    { src: '/photos/selected/housing.jpg', alt: 'Housing included with many roles' },
  ],
  visa: [
    { src: '/photos/selected/visa.jpg', alt: 'Visa and travel documents laid out' },
    { src: '/photos/documents.jpg', alt: 'Checking documents for a work visa' },
    { src: '/photos/selected/flight.jpg', alt: 'Flight to Portugal after selection' },
    { src: '/photos/selected/contract.jpg', alt: 'Employment contract ready to sign' },
    PHOTO_TRAM,
    PHOTO_LISBON,
  ],
  about: [
    PHOTO_LISBON,
    PHOTO_KITCHEN,
    PHOTO_SITE,
    { src: '/photos/brand/employer-handshake.jpg', alt: 'Handshake after agreeing a hiring brief' },
    PHOTO_TRAM,
  ],
  contact: [
    PHOTO_LISBON,
    { src: '/photos/phone.jpg', alt: 'Support on WhatsApp and phone' },
    PHOTO_KITCHEN,
    PHOTO_PORTO,
  ],
  signup: [PHOTO_LISBON, PHOTO_KITCHEN, PHOTO_TRAM, PHOTO_SITE],
  employers: [
    { src: '/photos/brand/employer-handshake.jpg', alt: 'Handshake after agreeing a hiring brief' },
    PHOTO_KITCHEN,
    PHOTO_SITE,
    PHOTO_LISBON,
  ],
  employerRegister: [
    { src: '/photos/brand/employer-handshake.jpg', alt: 'Handshake after agreeing a hiring brief' },
    PHOTO_KITCHEN,
    PHOTO_SITE,
    PHOTO_PORTO,
  ],
  jobDetailFallback: [
    PHOTO_KITCHEN,
    { src: '/photos/kitchen.jpg', alt: 'Restaurant kitchen work in Portugal' },
    { src: '/photos/brand/hero-service-floor.jpg', alt: 'Plated dish on a restaurant service floor' },
    PHOTO_LISBON,
  ],
} as const satisfies Record<string, BrandSlide[]>;

export function slidesWithCaptions(slides: readonly BrandSlide[]): BrandSlide[] {
  return slides.map((slide) => ({ ...slide, caption: slide.caption ?? '' }));
}
