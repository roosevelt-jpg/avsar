import { canonicalSectors } from '@/lib/i18n/dictionary';

/**
 * Sectors are stored by slug. The English label is the canonical display form
 * in admin and employer surfaces; candidate surfaces use the localised label
 * from the dictionary at the same index.
 */
export const SECTOR_SLUGS = [
  'hospitality',
  'property-management',
  'cleaning',
  'drivers',
  'maintenance',
  'construction',
  'it',
] as const;

export type SectorSlug = (typeof SECTOR_SLUGS)[number];

export function sectorLabel(slug: SectorSlug): string {
  return canonicalSectors[SECTOR_SLUGS.indexOf(slug)] ?? slug;
}

export function sectorIndex(slug: SectorSlug): number {
  return SECTOR_SLUGS.indexOf(slug);
}

export function sectorFromIndex(index: number): SectorSlug {
  return SECTOR_SLUGS[index] ?? SECTOR_SLUGS[0];
}

/** Photo placeholder captions, one per sector, from the handoff. */
export const SECTOR_PHOTO_NOTES: Record<SectorSlug, string> = {
  hospitality: 'photo · Hospitality',
  'property-management': 'photo · Property management',
  cleaning: 'photo · Cleaning',
  drivers: 'photo · Drivers',
  maintenance: 'photo · Maintenance',
  construction: 'photo · Construction',
  it: 'photo · IT',
};
