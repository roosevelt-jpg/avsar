/**
 * Assessment item bank. SERVER ONLY.
 *
 * `correct` must never reach the browser, so every path that sends items to the
 * client goes through `toClientItem`. The three English items are reproduced
 * verbatim from the prototype; the rest are placeholder content standing in for
 * a real, calibrated item bank.
 *
 * Production notes from the handoff:
 *  - The English score should come from a recognised provider (Duolingo English
 *    Test, EnglishScore, Versant) rather than from these items, so the CEFR
 *    level on the report is defensible to an employer.
 *  - The speaking item is a placeholder: it needs audio capture and upload.
 */

import type { SectorSlug } from '@/lib/data/sectors';

export type SectionId = 'skills' | 'experience' | 'english' | 'profile';

export const SECTION_ORDER: readonly SectionId[] = ['skills', 'experience', 'english', 'profile'];

export type Item = {
  id: string;
  section: SectionId;
  /** Mono label above the question, e.g. "ENGLISH · READING". */
  label: string;
  /** Optional passage card shown above the question. */
  passage?: string;
  prompt: string;
  options: readonly string[];
  /** Index of the correct option. Undefined for unscored profile items. */
  correct?: number;
  /** Restricts an item to one sector. Undefined means it applies to all. */
  sector?: SectorSlug;
  /** Report axis this item feeds, matched against `dash.breakdownLabels`. */
  axis?: string;
};

import { EXPERIENCE_ITEMS, ENGLISH_ITEMS, PROFILE_ITEMS } from './bank/shared';
import {
  HOSPITALITY_ITEMS,
  PROPERTY_ITEMS,
  CLEANING_ITEMS,
  DRIVER_ITEMS,
  MAINTENANCE_ITEMS,
  CONSTRUCTION_ITEMS,
} from './bank/sectors';

/**
 * The bank, assembled from the per-sector files.
 *
 * Split by sector so each set stays reviewable by someone who knows that trade.
 * A hospitality supervisor can read the hospitality file and say whether the
 * questions are fair; nobody can usefully review one list of a hundred.
 */
export const ITEM_BANK: readonly Item[] = [
  ...HOSPITALITY_ITEMS,
  ...PROPERTY_ITEMS,
  ...CLEANING_ITEMS,
  ...DRIVER_ITEMS,
  ...MAINTENANCE_ITEMS,
  ...CONSTRUCTION_ITEMS,
  ...EXPERIENCE_ITEMS,
  ...ENGLISH_ITEMS,
  ...PROFILE_ITEMS,
];

/** Shape sent to the browser. Never includes `correct`. */
export type ClientItem = Omit<Item, 'correct' | 'axis'>;

export function toClientItem(item: Item): ClientItem {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- discarding the answer key on purpose
  const { correct: _correct, axis: _axis, ...rest } = item;
  return rest;
}

/**
 * Items for one candidate's section, filtered to their sector.
 *
 * Randomisation is seeded by candidate id so a reload returns the same order:
 * the handoff requires resume-after-disconnect, and a reshuffle would break it.
 */
export function itemsForSection(section: SectionId, sector: SectorSlug, seed: string): Item[] {
  const pool = ITEM_BANK.filter(
    (item) => item.section === section && (item.sector === undefined || item.sector === sector),
  );
  return shuffleSeeded(pool, `${seed}:${section}`);
}

/** Deterministic Fisher-Yates using a cheap string hash as the seed. */
function shuffleSeeded<T>(input: readonly T[], seed: string): T[] {
  const out = [...input];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const next = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h) / 2 ** 31;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}
