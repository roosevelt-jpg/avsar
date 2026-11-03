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
  careers: [
    { src: '/photos/brand/hero-workers.jpg', alt: 'Skilled professionals ready to work in Portugal' },
    { src: '/photos/brand/hero-chef.jpg', alt: 'A chef in a Portuguese restaurant kitchen' },
    { src: '/photos/brand/hero-construction.jpg', alt: 'A construction worker on a Portuguese building site' },
    { src: '/photos/brand/hero-hospitality.jpg', alt: 'A hospitality professional with Lisbon rooftops behind them' },
    { src: '/photos/brand/journey-tram.jpg', alt: 'A yellow Lisbon tram on a historic street' },
  ],
  jobs: [
    { src: '/photos/brand/jobs-hero-1.jpg', alt: 'A chef and a construction worker smiling in Portugal' },
    { src: '/photos/brand/hero-workers.jpg', alt: 'Skilled professionals ready to work in Portugal' },
    { src: '/photos/brand/hero-chef.jpg', alt: 'A chef in a Portuguese restaurant kitchen' },
    { src: '/photos/brand/hero-construction.jpg', alt: 'A construction worker on a Portuguese building site' },
    { src: '/photos/brand/hero-hospitality.jpg', alt: 'A hospitality professional with Lisbon rooftops' },
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
    { src: '/photos/brand/hero-hospitality.jpg', alt: 'Hospitality work with Lisbon behind' },
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
    { src: '/photos/brand/hero-hospitality.jpg', alt: 'Talent working in Portugal hospitality' },
    { src: '/photos/brand/employer-handshake.jpg', alt: 'Employer and candidate after a placement' },
    { src: '/photos/brand/hero-workers.jpg', alt: 'Skilled professionals from India' },
    { src: '/photos/lisbon.jpg', alt: 'Lisbon, Portugal' },
    { src: '/photos/brand/journey-tram.jpg', alt: 'Everyday life in Lisbon' },
  ],
  contact: [
    { src: '/photos/brand/employer-handshake.jpg', alt: 'Talking through a Portugal career move' },
    { src: '/photos/phone.jpg', alt: 'Support on WhatsApp and phone' },
    { src: '/photos/brand/hero-workers.jpg', alt: 'Candidates preparing for Portugal' },
    { src: '/photos/lisbon.jpg', alt: 'Lisbon skyline' },
  ],
  signup: [
    { src: '/photos/brand/hero-hospitality.jpg', alt: 'A professional starting a career in Portugal' },
    { src: '/photos/brand/hero-workers.jpg', alt: 'Skilled people ready for verified jobs' },
    { src: '/photos/steps/profile.jpg', alt: 'Creating a free profile' },
    { src: '/photos/brand/journey-tram.jpg', alt: 'Lisbon tram — your journey ahead' },
  ],
  employers: [
    { src: '/photos/brand/employer-handshake.jpg', alt: 'Employer and candidate shaking hands in Portugal' },
    { src: '/photos/brand/hero-workers.jpg', alt: 'Skilled professionals ready to work in Portugal' },
    { src: '/photos/brand/hero-chef.jpg', alt: 'A chef in a Portuguese restaurant kitchen' },
    { src: '/photos/brand/hero-construction.jpg', alt: 'A construction worker on a Portuguese building site' },
    { src: '/photos/brand/hero-hospitality.jpg', alt: 'A hospitality professional with Lisbon rooftops' },
  ],
  employerRegister: [
    { src: '/photos/brand/employer-register-hero.jpg', alt: 'Employer reviewing candidates on a laptop' },
    { src: '/photos/brand/employer-handshake.jpg', alt: 'Employer and candidate shaking hands' },
    { src: '/photos/brand/hero-workers.jpg', alt: 'Skilled professionals ready to work in Portugal' },
    { src: '/photos/brand/hero-chef.jpg', alt: 'Hospitality talent for Portuguese employers' },
  ],
  jobDetailFallback: [
    { src: '/photos/kitchen.jpg', alt: 'Restaurant service work in Portugal' },
    { src: '/photos/brand/hero-hospitality.jpg', alt: 'Hospitality professional in Portugal' },
    { src: '/photos/brand/hero-chef.jpg', alt: 'Kitchen team at work' },
    { src: '/photos/lisbon.jpg', alt: 'Lisbon, where many roles are based' },
  ],
} as const satisfies Record<string, BrandSlide[]>;

export function slidesWithCaptions(slides: readonly BrandSlide[]): BrandSlide[] {
  return slides.map((slide) => ({ ...slide, caption: slide.caption ?? '' }));
}
