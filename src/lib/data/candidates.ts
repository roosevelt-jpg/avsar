import { SECTOR_SLUGS, type SectorSlug } from './sectors';

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

/**
 * Sample talent pool from the prototype. Used when Supabase is not configured
 * so that the employer and admin screens stay reviewable, and as seed data.
 */
export const SAMPLE_TALENT: TalentRow[] = [
  ['Priya Sharma', 'Jaipur, Rajasthan', 0, 'C1', 91, 4],
  ['Arjun Nair', 'Kochi, Kerala', 0, 'B2', 86, 6],
  ['Mohammed Rafiq', 'Hyderabad, Telangana', 3, 'B1', 84, 9],
  ['Sunita Rao', 'Mangaluru, Karnataka', 2, 'B1', 83, 5],
  ['Gurpreet Singh', 'Ludhiana, Punjab', 3, 'B2', 82, 7],
  ['Anil Kumar', 'Patna, Bihar', 5, 'A2', 81, 11],
  ['Deepa Menon', 'Thrissur, Kerala', 1, 'B2', 80, 3],
  ['Ravi Verma', 'Lucknow, Uttar Pradesh', 4, 'B1', 79, 8],
  ['Fatima Shaikh', 'Pune, Maharashtra', 0, 'B2', 78, 3],
  ['Vikram Patel', 'Surat, Gujarat', 5, 'B1', 77, 6],
  ['Lakshmi Iyer', 'Chennai, Tamil Nadu', 2, 'B2', 76, 4],
  ['Joseph Dsouza', 'Panaji, Goa', 4, 'B1', 75, 5],
].map(([name, city, sectorIdx, english, score, years]) => ({
  id: `sample-${String(name).toLowerCase().replace(/[^a-z]+/g, '-')}`,
  name: name as string,
  city: city as string,
  sector: SECTOR_SLUGS[sectorIdx as number] ?? SECTOR_SLUGS[0],
  english: english as Cefr,
  score: score as number,
  yearsExperience: years as number,
}));

/** Example queries shown as pills under the employer search box. */
export const EXAMPLE_QUERIES = [
  'Night-shift drivers, Algarve',
  'Maintenance tech, 3y+ experience',
  'Construction crew of 8, Porto',
] as const;

export const DEFAULT_EMPLOYER_QUERY =
  'Hotel housekeeping staff with 3+ years experience, English B1 or above';
