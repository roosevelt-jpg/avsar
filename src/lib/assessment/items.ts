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

export const ITEM_BANK: readonly Item[] = [
  /* ---------------------------------------------------------------- skills */
  {
    id: 'skl-hosp-01',
    section: 'skills',
    label: 'SKILLS · GUEST SERVICE',
    prompt: 'A guest complains that their room was not cleaned. What do you do first?',
    options: [
      'Explain that the housekeeper was busy',
      'Apologise, then arrange for the room to be cleaned immediately',
      'Ask the guest to come back later',
      'Tell the guest to call the manager',
    ],
    correct: 1,
    sector: 'hospitality',
    axis: 'Guest service',
  },
  {
    id: 'skl-hosp-02',
    section: 'skills',
    label: 'SKILLS · HOUSEKEEPING',
    prompt: 'Which order is correct when servicing an occupied guest room?',
    options: [
      'Bathroom, then dusting, then beds, then floors',
      'Beds, then dusting, then bathroom, then floors',
      'Floors, then beds, then bathroom, then dusting',
      'Dusting, then floors, then beds, then bathroom',
    ],
    correct: 1,
    sector: 'hospitality',
    axis: 'Housekeeping standards',
  },
  {
    id: 'skl-safety-01',
    section: 'skills',
    label: 'SKILLS · HEALTH AND SAFETY',
    prompt: 'You find a chemical bottle with no label in a storage cupboard. What is correct?',
    options: [
      'Use it only for floors',
      'Pour it away in the sink',
      'Do not use it and report it to your supervisor',
      'Mix it with water to make it safer',
    ],
    correct: 2,
    axis: 'Health and safety',
  },
  {
    id: 'skl-safety-02',
    section: 'skills',
    label: 'SKILLS · HEALTH AND SAFETY',
    prompt: 'A wet floor sign is missing after you mop a corridor. What do you do?',
    options: [
      'Carry on, the floor dries quickly',
      'Stop and get a sign before leaving the area',
      'Warn the next person you see',
      'Mop again more lightly',
    ],
    correct: 1,
    axis: 'Health and safety',
  },

  /* ------------------------------------------------------------ experience */
  {
    id: 'exp-01',
    section: 'experience',
    label: 'EXPERIENCE · ROLE HISTORY',
    prompt: 'In your most recent job, how many people did you work with on a typical shift?',
    options: ['I worked alone', '2 to 4 people', '5 to 10 people', 'More than 10 people'],
    axis: 'Guest service',
  },
  {
    id: 'exp-02',
    section: 'experience',
    label: 'EXPERIENCE · RESPONSIBILITY',
    prompt: 'Have you been responsible for training or supervising other staff?',
    options: ['No', 'Informally, when asked', 'Yes, as part of my role', 'Yes, I managed a team'],
    axis: 'Guest service',
  },

  /* --------------------------------------------------------------- english */
  /* Verbatim from the prototype. */
  {
    id: 'eng-read-01',
    section: 'english',
    label: 'ENGLISH · READING',
    passage:
      'Message from a guest: "Our flight lands at 23:40. Please keep our room and leave the key at reception."',
    prompt: 'What should the reception team do?',
    options: [
      'Cancel the booking',
      'Hold the room for a late arrival',
      'Move the guest to another hotel',
      'Charge a no-show fee',
    ],
    correct: 1,
    axis: 'English: reading',
  },
  {
    id: 'eng-gram-01',
    section: 'english',
    label: 'ENGLISH · GRAMMAR',
    prompt: 'Choose the correct sentence.',
    options: [
      'I have worked here since 2021.',
      'I am working here since 2021.',
      'I work here since 2021.',
      'I worked here since 2021 year.',
    ],
    correct: 0,
    axis: 'English: reading',
  },
  {
    id: 'eng-work-01',
    section: 'english',
    label: 'ENGLISH · WORKPLACE',
    prompt: 'A guest reports a leaking tap at 22:00. What do you do first?',
    options: [
      'Tell them to wait until morning',
      'Log it and inform the maintenance person on duty',
      'Fix it yourself without telling anyone',
      'Ignore it if the guest leaves tomorrow',
    ],
    correct: 1,
    axis: 'English: reading',
  },

  /* --------------------------------------------------------------- profile */
  {
    id: 'pro-01',
    section: 'profile',
    label: 'PROFILE · AVAILABILITY',
    prompt: 'How soon could you start a job abroad?',
    options: ['Within 1 month', '1 to 3 months', '3 to 6 months', 'More than 6 months'],
  },
  {
    id: 'pro-02',
    section: 'profile',
    label: 'PROFILE · MOBILITY',
    prompt: 'Would you accept shared staff accommodation?',
    options: ['Yes', 'Yes, if I have my own room', 'Only for the first months', 'No'],
  },
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
