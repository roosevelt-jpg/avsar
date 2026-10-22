/**
 * Photographs for the shopfront. Illustration files read as stickers, and the
 * walkthrough paths in older page data are not in this repo, so a missing or
 * drawn image is swapped for one of these at render time. The label stays
 * whatever the page editor wrote.
 */
export const SCENE_PHOTOS = [
  '/photos/kitchen.jpg',
  '/photos/lisbon.jpg',
  '/photos/documents.jpg',
  '/photos/phone.jpg',
] as const;

/** One picture per step, in the order the homepage tells the story. */
export const STEP_PHOTOS = [
  '/photos/steps/profile.jpg',
  '/photos/steps/test.jpg',
  '/photos/steps/apply.jpg',
  '/photos/steps/interview.jpg',
  '/photos/steps/visa.jpg',
  '/photos/steps/arrival.jpg',
] as const;

const STEP_BY_PATH: Record<string, string> = {
  '/walkthrough/register.jpg': STEP_PHOTOS[0],
  '/walkthrough/assessment.jpg': STEP_PHOTOS[1],
  '/walkthrough/fee.jpg': STEP_PHOTOS[2],
  '/walkthrough/call.jpg': STEP_PHOTOS[3],
  '/walkthrough/letter.jpg': STEP_PHOTOS[4],
  '/walkthrough/documents.jpg': STEP_PHOTOS[5],
};

/**
 * The "if you are selected" frame rotates through these. A single rooftop
 * photo was standing in for the contract, the housing, the flight and the visa.
 */
export const SELECTED_FRAMES = [
  { src: '/photos/selected/contract.jpg', alt: 'An employment contract ready to read' },
  { src: '/photos/selected/housing.jpg', alt: 'Housing and a meal included with the job' },
  { src: '/photos/selected/flight.jpg', alt: 'The flight when a candidate is selected' },
  { src: '/photos/selected/visa.jpg', alt: 'A passport and the visa file' },
] as const;

export function scenePhoto(src: string, index: number): string {
  if (src && STEP_BY_PATH[src]) return STEP_BY_PATH[src];
  if (
    src &&
    !src.includes('/illustrations/') &&
    !src.startsWith('/walkthrough/') &&
    !src.includes('lisbon-rooftops') &&
    !src.startsWith('/video/')
  ) {
    return src;
  }
  return SCENE_PHOTOS[index % SCENE_PHOTOS.length] ?? SCENE_PHOTOS[0];
}

/**
 * Photographs whose screen is a blank or generic mock. The homepage draws the
 * real mobile page there instead, so the phone shows this site.
 */
export type ShopPhone = 'signup' | 'assessment' | 'jobs' | 'pricing';

const PHONE_SCREENS: Record<string, ShopPhone> = {
  '/photos/steps/profile.jpg': 'signup',
  '/photos/steps/test.jpg': 'assessment',
  '/photos/steps/apply.jpg': 'jobs',
  '/photos/phone.jpg': 'pricing',
};

export function phoneScreenFor(src: string): ShopPhone | null {
  return PHONE_SCREENS[src] ?? null;
}

/** A step card keeps the editor's own upload, and otherwise the picture for that step. */
export function stepPhoto(src: string, index: number): string {
  if (src && STEP_BY_PATH[src]) return STEP_BY_PATH[src];
  if (src && src.startsWith('/photos/steps/')) return src;
  if (
    src &&
    !src.includes('/illustrations/') &&
    !src.startsWith('/walkthrough/') &&
    !src.startsWith('/video/')
  ) {
    return src;
  }
  return STEP_PHOTOS[index % STEP_PHOTOS.length] ?? STEP_PHOTOS[0];
}
