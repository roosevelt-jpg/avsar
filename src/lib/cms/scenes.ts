/**
 * Stock stand-ins for a missing picture. The 3D illustrations are the
 * shopfront set; a saved page that still points at a walkthrough file or a
 * generic phone photograph is shown as one of those instead.
 */
const AS_3D: Record<string, string> = {
  '/photos/steps/profile.jpg': '/illustrations/skills-test.jpg',
  '/photos/steps/test.jpg': '/illustrations/skills-test.jpg',
  '/photos/steps/apply.jpg': '/illustrations/find-job.jpg',
  '/photos/steps/interview.jpg': '/illustrations/chat.jpg',
  '/photos/steps/visa.jpg': '/illustrations/visa.jpg',
  '/photos/steps/arrival.jpg': '/illustrations/flight.jpg',
  '/photos/selected/contract.jpg': '/illustrations/payment.jpg',
  '/photos/selected/flight.jpg': '/illustrations/flight.jpg',
  '/photos/selected/visa.jpg': '/illustrations/visa.jpg',
  '/photos/phone.jpg': '/illustrations/skills-test.jpg',
};

/** The 3D render for a marketing slot, or the editor's own picture. */
export function marketingImage(src: string): string {
  if (src && AS_3D[src]) return AS_3D[src];
  return src;
}
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
  if (src && AS_3D[src]) return AS_3D[src];
  if (src && STEP_BY_PATH[src]) return marketingImage(STEP_BY_PATH[src]);
  if (src && src.includes('/illustrations/')) return src;
  if (
    src &&
    !src.startsWith('/walkthrough/') &&
    !src.includes('lisbon-rooftops') &&
    !src.startsWith('/video/')
  ) {
    return src;
  }
  return marketingImage(SCENE_PHOTOS[index % SCENE_PHOTOS.length] ?? SCENE_PHOTOS[0]);
}

/** A step card keeps the editor's own upload, and otherwise the picture for that step. */
export function stepPhoto(src: string, index: number): string {
  if (src && AS_3D[src]) return AS_3D[src];
  if (src && STEP_BY_PATH[src]) return marketingImage(STEP_BY_PATH[src]);
  if (src && src.startsWith('/photos/steps/')) return marketingImage(src);
  if (
    src &&
    !src.includes('/illustrations/') &&
    !src.startsWith('/walkthrough/') &&
    !src.startsWith('/video/')
  ) {
    return src;
  }
  return marketingImage(STEP_PHOTOS[index % STEP_PHOTOS.length] ?? STEP_PHOTOS[0]);
}
