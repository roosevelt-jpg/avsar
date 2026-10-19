import type { SectorSlug } from './sectors';

/** CEFR levels the platform reports on, ordered weakest to strongest. */
export const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type Cefr = (typeof CEFR)[number];

export function cefrRank(level: Cefr): number {
  return CEFR.indexOf(level);
}

export type TalentRow = {
  id: string;
  name: string;
  city: string;
  sector: SectorSlug;
  english: Cefr;
  score: number;
  yearsExperience: number;
  /** Whether a voice introduction exists. The clip itself is fetched separately. */
  hasVoiceIntro?: boolean;
};

/** Initials for the avatar chip: "Priya Sharma" -> "PS". */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Example queries shown as pills under the employer search box. */
export const EXAMPLE_QUERIES = [
  'Night-shift drivers, Algarve',
  'Maintenance tech, 3y+ experience',
  'Construction crew of 8, Porto',
] as const;

export const DEFAULT_EMPLOYER_QUERY =
  'Hotel housekeeping staff with 3+ years experience, English B1 or above';
