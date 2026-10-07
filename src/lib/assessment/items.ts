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
 *  - There is no speaking item, and the section no longer claims one. Spoken
 *    English is captured on the profile as an unscored recording that employers
 *    listen to themselves; see 0011_voice_intro.sql for why it is not marked.
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
  /** Index of the correct option. Undefined for items with no right answer. */
  correct?: number;
  /**
   * Ordinal item: the options run from least to most, and the answer scores by
   * its position rather than against a key.
   *
   * "How many people did you supervise?" has no correct answer, but it is not
   * uninformative either. Without this the whole experience section scored zero
   * for every candidate, because no item in it has a `correct`.
   */
  scale?: boolean;
  /** Restricts an item to one sector. Undefined means it applies to all. */
  sector?: SectorSlug;
  /**
   * Narrows further, to specific positions within that sector.
   *
   * A data analyst and a QA tester share a sector and not a job. Scoping by
   * position avoids a new enum value for every role, which is exactly the churn
   * `positions.ts` exists to prevent.
   */
  positions?: readonly string[];
  /** Report axis this item feeds, matched against `dash.breakdownLabels`. */
  axis?: string;
};

import { EXPERIENCE_ITEMS, ENGLISH_ITEMS, PROFILE_ITEMS } from './bank/shared';
import { IT_ITEMS } from './bank/it';
import { CHEF_ITEMS, FB_SERVICE_ITEMS } from './bank/food-beverage';
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
  ...CHEF_ITEMS,
  ...FB_SERVICE_ITEMS,
  ...PROPERTY_ITEMS,
  ...CLEANING_ITEMS,
  ...DRIVER_ITEMS,
  ...MAINTENANCE_ITEMS,
  ...CONSTRUCTION_ITEMS,
  ...IT_ITEMS,
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
export function itemsForSection(
  section: SectionId,
  sector: SectorSlug,
  seed: string,
  position?: string,
): Item[] {
  const pool = ITEM_BANK.filter(
    (item) =>
      item.section === section &&
      (item.sector === undefined || item.sector === sector) &&
      (item.positions === undefined || (position !== undefined && item.positions.includes(position))),
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
