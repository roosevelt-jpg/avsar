/**
 * Turns an employer's plain-language search into structured filters.
 *
 * Deterministic on purpose: the handoff allows an LLM here, but a rule-based
 * parser costs nothing, never hallucinates a filter and is testable. An LLM can
 * be layered in front later for the queries this misses, with the parsed
 * filters always shown back to the employer so they can correct them.
 */

import { CEFR, type Cefr } from '@/lib/data/candidates';
import { SECTOR_SLUGS, type SectorSlug } from '@/lib/data/sectors';

export type ParsedQuery = {
  sector?: SectorSlug;
  minEnglish?: Cefr;
  minYears?: number;
  headcount?: number;
  location?: string;
  /** Terms the parser could not classify, matched against name and city. */
  freeText: string[];
};

/** Words that point at a sector, including common role names. */
const SECTOR_HINTS: Record<SectorSlug, readonly string[]> = {
  hospitality: ['hospitality', 'hotel', 'housekeeping', 'housekeeper', 'waiter', 'waitress', 'kitchen', 'chef', 'reception', 'f&b'],
  'property-management': ['property', 'property management', 'caretaker', 'concierge', 'building manager'],
  cleaning: ['cleaning', 'cleaner', 'janitor', 'janitorial'],
  drivers: ['driver', 'drivers', 'chauffeur', 'delivery'],
  maintenance: ['maintenance', 'technician', 'tech', 'plumber', 'electrician', 'handyman'],
  construction: ['construction', 'builder', 'mason', 'carpenter', 'scaffolder', 'crew'],
};

const PORTUGAL_PLACES = [
  'lisbon',
  'lisboa',
  'porto',
  'algarve',
  'faro',
  'cascais',
  'sintra',
  'braga',
  'coimbra',
  'madeira',
  'azores',
];

export function parseQuery(raw: string): ParsedQuery {
  const text = raw.toLowerCase();
  const result: ParsedQuery = { freeText: [] };

  for (const slug of SECTOR_SLUGS) {
    if (SECTOR_HINTS[slug].some((hint) => text.includes(hint))) {
      result.sector = slug;
      break;
    }
  }

  // "English B1 or above", "B1+", "english b2"
  const cefr = text.match(/\b([abc][12])\s*\+?/);
  if (cefr?.[1]) {
    const level = cefr[1].toUpperCase() as Cefr;
    if ((CEFR as readonly string[]).includes(level)) result.minEnglish = level;
  }

  // "3+ years", "3 years experience", "at least 5 years"
  const years = text.match(/(\d+)\s*\+?\s*(?:years?|yrs?|y)\b/);
  if (years?.[1]) result.minYears = Number(years[1]);

  // "12 housekeepers", "crew of 8"
  const ofCount = text.match(/\bof\s+(\d+)\b/);
  const leadCount = text.match(/^\s*(\d+)\s+[a-z]/);
  const count = ofCount?.[1] ?? leadCount?.[1];
  if (count) result.headcount = Number(count);

  const place = PORTUGAL_PLACES.find((p) => text.includes(p));
  if (place) result.location = place;

  const consumed = new Set<string>([
    ...(result.sector ? SECTOR_HINTS[result.sector] : []),
    ...(result.location ? [result.location] : []),
    'english',
    'experience',
    'years',
    'year',
    'above',
    'with',
    'and',
    'or',
    'for',
    'in',
    'of',
    'a',
    'the',
    'start',
    'starting',
  ]);
  result.freeText = text
    .split(/[^a-z0-9+]+/)
    .filter((word) => word.length > 2 && !consumed.has(word) && !/^\d+$/.test(word));

  return result;
}

/** Human-readable summary of what the parser understood, shown back to the employer. */
export function describeQuery(parsed: ParsedQuery, sectorLabel: (s: SectorSlug) => string): string[] {
  const parts: string[] = [];
  if (parsed.headcount) parts.push(`${parsed.headcount} people`);
  if (parsed.sector) parts.push(sectorLabel(parsed.sector));
  if (parsed.minEnglish) parts.push(`English ${parsed.minEnglish}+`);
  if (parsed.minYears) parts.push(`${parsed.minYears}+ years`);
  if (parsed.location) parts.push(`for ${parsed.location.charAt(0).toUpperCase()}${parsed.location.slice(1)}`);
  return parts;
}
