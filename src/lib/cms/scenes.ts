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

export function scenePhoto(src: string, index: number): string {
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
