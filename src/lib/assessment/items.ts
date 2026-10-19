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
  /**
   * The same item in Hindi.
   *
   * Options must stay in the same order as the English ones, because `correct`
   * indexes one array and serves both. The English section deliberately has
   * none of these: it is the only section where the language is the thing being
   * measured.
   */
  hi?: {
    label?: string;
    passage?: string;
    prompt: string;
    options: readonly string[];
  };
};

import { EXPERIENCE_ITEMS, ENGLISH_ITEMS, PROFILE_ITEMS } from './bank/shared';
import { IT_ITEMS } from './bank/it';
import { CHEF_ITEMS, FB_SERVICE_ITEMS } from './bank/food-beverage';
import {
  ELECTRICIAN_ITEMS,
  PLUMBER_ITEMS,
  WELDER_ITEMS,
  CONSTRUCTION_WORKER_ITEMS,
} from './bank/trades';
import { DRIVER_ROLE_ITEMS, LOGISTICS_ITEMS } from './bank/logistics';
import { HI } from './bank/hi';
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
const ENGLISH_BANK: readonly Item[] = [
  ...HOSPITALITY_ITEMS,
  ...CHEF_ITEMS,
  ...FB_SERVICE_ITEMS,
  ...ELECTRICIAN_ITEMS,
  ...PLUMBER_ITEMS,
  ...WELDER_ITEMS,
  ...CONSTRUCTION_WORKER_ITEMS,
  ...DRIVER_ROLE_ITEMS,
  ...LOGISTICS_ITEMS,
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

/**
 * The bank, with the Hindi side attached.
 *
 * A translation whose option count does not match the English is dropped rather
 * than served. `correct` indexes one array for both languages, so a Hindi item
 * with three options where the English has four does not fail: it quietly
 * renders a different question with the key pointing somewhere else. Losing the
 * translation is recoverable, and the English item still works; a misaligned
 * key is a wrong score that nobody sees.
 */
export const ITEM_BANK: readonly Item[] = ENGLISH_BANK.map((item) => {
  const hi = HI[item.id];
  if (!hi) return item;

  if (hi.options.length !== item.options.length) {
    console.error(
      `[items] Hindi translation for ${item.id} has ${hi.options.length} options, English has ${item.options.length}. Dropped.`,
    );
    return item;
  }

  return { ...item, hi };
});

/** Items with no translation yet. Read by the item-coverage check. */
export function untranslatedItems(): Item[] {
  return ENGLISH_BANK.filter((item) => item.section !== 'english' && !HI[item.id]);
}

/** Shape sent to the browser. Never includes `correct`. */
export type ClientItem = Omit<Item, 'correct' | 'axis' | 'hi'>;

/**
 * The order this candidate sees the options in.
 *
 * Fixed option order is how an unsupervised test leaks: the answer travels as
 * "it is always B" rather than as knowledge, and one shared screenshot devalues
 * the item for everybody. The permutation is derived from the attempt and the
 * item, so it is the same on every reload without storing anything, and it can
 * be recomputed wherever an answer has to be read back.
 *
 * Ordinal items are never shuffled. Their options run from least to most and
 * the position *is* the meaning, so reordering them would turn "I supervised
 * nobody" into a top score.
 */
export function optionOrder(item: Item, seed: string): number[] {
  const identity = item.options.map((_, index) => index);
  if (item.scale) return identity;
  return shuffleSeeded(identity, `${seed}:opt:${item.id}`);
}

/** What the candidate pressed, in the bank's own numbering. */
export function toCanonicalOption(item: Item, seed: string, displayIndex: number): number {
  return optionOrder(item, seed)[displayIndex] ?? displayIndex;
}

/** The stored answer, in the order this candidate is looking at. */
export function toDisplayOption(item: Item, seed: string, canonicalIndex: number): number {
  const found = optionOrder(item, seed).indexOf(canonicalIndex);
  return found === -1 ? canonicalIndex : found;
}

export function itemById(id: string): Item | undefined {
  return ITEM_BANK.find((item) => item.id === id);
}

/**
 * Strips the answer key, shuffles the options, and picks the language.
 *
 * `correct` indexes the English options, and the Hindi options are written in
 * the same order deliberately, so one key serves both and a translation cannot
 * silently move the right answer.
 */
export function toClientItem(item: Item, seed: string, locale: string): ClientItem {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- discarding the answer key on purpose
  const { correct: _correct, axis: _axis, hi, ...rest } = item;
  const source = locale === 'hi' && hi ? hi : item;
  const order = optionOrder(item, seed);

  return {
    ...rest,
    label: source.label ?? item.label,
    prompt: source.prompt,
    passage: source.passage ?? item.passage,
    options: order.map((index) => source.options[index] ?? item.options[index] ?? ''),
  };
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
