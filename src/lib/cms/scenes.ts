/**
 * Photographs for the shopfront. Illustration files read as stickers, and the
 * walkthrough paths in older page data are not in this repo, so a missing or
 * drawn image is swapped for one of these at render time. The label stays
 * whatever the page editor wrote.
 *
 * Prefer documentary Portugal place/work stills. Do not use `/photos/lisbon.jpg`
 * — that file is Madrid Gran Vía, not Lisbon.
 */
export const SCENE_PHOTOS = [
  '/lisbon-rooftops-1200.jpg',
  '/kitchen-work-1400.jpg',
  '/photos/brand/hero-construction.jpg',
  '/photos/brand/journey-tram-real.jpg',
] as const;

/** One picture per step — place/work documentary order, not staged hand gestures. */
export const STEP_PHOTOS = [
  '/kitchen-work-1400.jpg',
  '/photos/documents.jpg',
  '/photos/brand/hero-jobsite.jpg',
  '/photos/brand/employer-handshake.jpg',
  '/photos/selected/visa.jpg',
  '/photos/brand/journey-tram-real.jpg',
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

/** Paths that look like Portugal but are the wrong city or staged stock. */
export const BLOCKED_PHOTOS = ['/photos/lisbon.jpg', '/photos/brand/employer-meeting.jpg'] as const;

const BLOCKED_PHOTO_SET: ReadonlySet<string> = new Set(BLOCKED_PHOTOS);

function isUsablePhoto(src: string): boolean {
  if (!src) return false;
  if (BLOCKED_PHOTO_SET.has(src)) return false;
  if (src.includes('/illustrations/')) return false;
  if (src.startsWith('/walkthrough/')) return false;
  if (src.startsWith('/video/')) return false;
  return true;
}

export function scenePhoto(src: string, index: number): string {
  if (src && STEP_BY_PATH[src]) return STEP_BY_PATH[src];
  if (isUsablePhoto(src)) return src;
  return SCENE_PHOTOS[index % SCENE_PHOTOS.length] ?? SCENE_PHOTOS[0];
}

/** A step card keeps the editor's own upload, and otherwise the picture for that step. */
export function stepPhoto(src: string, index: number): string {
  if (src && STEP_BY_PATH[src]) return STEP_BY_PATH[src];
  if (src && src.startsWith('/photos/steps/') && isUsablePhoto(src)) return src;
  if (isUsablePhoto(src)) return src;
  return STEP_PHOTOS[index % STEP_PHOTOS.length] ?? STEP_PHOTOS[0];
}
