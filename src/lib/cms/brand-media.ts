/**
 * Shared photographs and the intro film for marketing heroes.
 *
 * Paths live under `public/` so the CMS media picker and Settings forms can
 * keep or replace them later. Defaults import these packs so every shopfront
 * page ships a real slideshow instead of a single static frame.
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

export const BRAND_SLIDES = {
  /* Documentary place/work stills — avoid posed AI portrait collages on heroes. */
  careers: [
    { src: '/photos/brand/hero-lisbon-street.jpg', alt: 'A yellow tram on a steep Lisbon street' },
    { src: '/photos/brand/hero-kitchen-work.jpg', alt: 'A chef plating a dish in a restaurant kitchen' },
    { src: '/photos/brand/hero-jobsite.jpg', alt: 'Construction crew on a Portuguese building site' },
    { src: '/photos/brand/journey-tram.jpg', alt: 'A yellow Lisbon tram on a historic street' },
  ],
  jobs: [
    { src: '/photos/brand/hero-kitchen-work.jpg', alt: 'Kitchen team at work in Portugal' },
    { src: '/photos/brand/hero-jobsite.jpg', alt: 'Construction crew on site in Portugal' },
    { src: '/photos/brand/hero-service-floor.jpg', alt: 'Restaurant service on the floor' },
    { src: '/photos/brand/hero-lisbon-street.jpg', alt: 'Lisbon street where many roles are based' },
    { src: '/photos/brand/journey-tram.jpg', alt: 'Everyday Lisbon — tram on a historic street' },
  ],
  journey: [
    { src: '/photos/steps/profile.jpg', alt: 'Creating a career profile on a phone' },
    { src: '/photos/steps/test.jpg', alt: 'Taking the free skills assessment' },
    { src: '/photos/steps/apply.jpg', alt: 'Applying to a verified job' },
    { src: '/photos/steps/interview.jpg', alt: 'Interviewing with an employer on a video call' },
    { src: '/photos/steps/visa.jpg', alt: 'Preparing visa documents' },
    { src: '/photos/steps/arrival.jpg', alt: 'Arriving in Portugal for work' },
    { src: '/photos/brand/journey-tram.jpg', alt: 'A yellow Lisbon tram on a historic street' },
  ],
  portugal: [
    { src: '/photos/lisbon.jpg', alt: 'Lisbon waterfront and skyline' },
    { src: '/lisbon-rooftops-1200.jpg', alt: 'Lisbon rooftops and the river Tagus' },
    { src: '/photos/brand/hero-hospitality.jpg', alt: 'Restaurant dining room in Portugal' },
    { src: '/photos/brand/journey-tram.jpg', alt: 'Lisbon street with a yellow tram' },
    { src: '/photos/selected/housing.jpg', alt: 'Housing included with many roles' },
  ],
  visa: [
    { src: '/photos/selected/visa.jpg', alt: 'Visa and travel documents laid out' },
    { src: '/photos/documents.jpg', alt: 'Checking documents for a work visa' },
    { src: '/photos/selected/flight.jpg', alt: 'Flight to Portugal after selection' },
    { src: '/photos/selected/contract.jpg', alt: 'Employment contract ready to sign' },
    { src: '/photos/steps/arrival.jpg', alt: 'Arrival support in Portugal' },
    { src: '/photos/brand/journey-tram.jpg', alt: 'Settling into life in Lisbon' },
  ],
  about: [
    { src: '/photos/brand/hero-hospitality.jpg', alt: 'A busy restaurant floor in Portugal' },
    { src: '/photos/brand/employer-meeting.jpg', alt: 'Hiring managers reviewing a placement' },
    { src: '/photos/brand/hero-kitchen-work.jpg', alt: 'Kitchen work — a common Portugal role' },
    { src: '/photos/lisbon.jpg', alt: 'Lisbon rooftops and the river' },
    { src: '/photos/brand/journey-tram.jpg', alt: 'Everyday life in Lisbon' },
  ],
  contact: [
    { src: '/photos/brand/employer-meeting.jpg', alt: 'Talking through a Portugal career move' },
    { src: '/photos/phone.jpg', alt: 'Support on WhatsApp and phone' },
    { src: '/photos/brand/hero-service-floor.jpg', alt: 'Hospitality work in Portugal' },
    { src: '/photos/lisbon.jpg', alt: 'Lisbon skyline' },
  ],
  signup: [
    { src: '/photos/brand/hero-lisbon-street.jpg', alt: 'Lisbon — where many roles are based' },
    { src: '/photos/brand/hero-kitchen-work.jpg', alt: 'Kitchen work in Portugal' },
    { src: '/photos/steps/profile.jpg', alt: 'Creating a free profile' },
    { src: '/photos/brand/journey-tram.jpg', alt: 'Lisbon tram — your journey ahead' },
  ],
  employers: [
    { src: '/photos/brand/employer-meeting.jpg', alt: 'Hiring managers reviewing a placement together' },
    { src: '/photos/brand/hero-kitchen-work.jpg', alt: 'Hospitality talent for Portuguese employers' },
    { src: '/photos/brand/hero-jobsite.jpg', alt: 'Trade talent ready for Portuguese sites' },
    { src: '/photos/brand/hero-lisbon-street.jpg', alt: 'Portugal — where placements are based' },
  ],
  employerRegister: [
    { src: '/photos/brand/employer-meeting.jpg', alt: 'Employer team reviewing candidates' },
    { src: '/photos/brand/employer-register-hero.jpg', alt: 'Employer reviewing candidates on a laptop' },
    { src: '/photos/brand/hero-kitchen-work.jpg', alt: 'Hospitality talent for Portuguese employers' },
    { src: '/photos/brand/hero-jobsite.jpg', alt: 'Trade talent for Portuguese sites' },
  ],
  jobDetailFallback: [
    { src: '/photos/kitchen.jpg', alt: 'Restaurant kitchen work in Portugal' },
    { src: '/photos/brand/hero-kitchen-work.jpg', alt: 'Chef plating in a restaurant kitchen' },
    { src: '/photos/brand/hero-service-floor.jpg', alt: 'Restaurant service on the floor' },
    { src: '/photos/brand/hero-lisbon-street.jpg', alt: 'Lisbon, where many roles are based' },
  ],
} as const satisfies Record<string, BrandSlide[]>;

export function slidesWithCaptions(slides: readonly BrandSlide[]): BrandSlide[] {
  return slides.map((slide) => ({ ...slide, caption: slide.caption ?? '' }));
}
