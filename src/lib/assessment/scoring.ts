/**
 * Scoring. SERVER ONLY, because it reads the answer key.
 *
 * Percentage correct per axis, then a weighted overall. A working measure, not
 * psychometrics: the items are uncalibrated, so a score is a rough ordering and
 * not a measurement. See `docs/assessment.md`.
 */

import { ITEM_BANK, SECTION_ORDER, type Item, type SectionId } from './items';
import type { SectorSlug } from '@/lib/data/sectors';

export type AnswerMap = Record<string, number>;

export type AxisScore = { label: string; score: number };

export type ScoreResult = {
  overall: number;
  sections: Record<SectionId, number>;
  axes: AxisScore[];
};

/** Weight of each section in the overall score. Must sum to 1. */
const SECTION_WEIGHTS: Record<SectionId, number> = {
  skills: 0.4,
  experience: 0.2,
  english: 0.4,
  profile: 0,
};

/**
 * Items this candidate could have been shown.
 *
 * The filter has to match `itemsForSection` exactly, position included, and
 * leaving the position out does not merely blur the score, it deletes most of
 * it. A position-scoped item fails the test `positions === undefined ||
 * positions.includes(position)` whenever no position is passed, so every
 * role-specific item drops out of the pool and is never marked at all.
 *
 * Measured, not assumed: a chef who answered all twelve chef items wrongly
 * scored 100 on skills, because only the four items shared with the waiter were
 * counted, and the report showed three skills axes instead of six. The
 * role-specific questions were being asked and then thrown away.
 */
function visibleItems(sector: SectorSlug, position?: string): Item[] {
  return ITEM_BANK.filter(
    (item) =>
      (item.sector === undefined || item.sector === sector) &&
      (item.positions === undefined ||
        (position !== undefined && item.positions.includes(position))),
  );
}

/** An item contributes a score either against a key or by ordinal position. */
function isScorable(item: Item): boolean {
  return item.correct !== undefined || item.scale === true;
}

export function score(answers: AnswerMap, sector: SectorSlug, position?: string): ScoreResult {
  const pool = visibleItems(sector, position);
  const byId = new Map<string, Item>(pool.map((item) => [item.id, item]));

  const sections = {} as Record<SectionId, number>;
  for (const section of SECTION_ORDER) {
    sections[section] = ratio(
      pool.filter((item) => item.section === section && isScorable(item)),
      answers,
      byId,
    );
  }

  /* Only axes the candidate was actually assessed on. An axis with no scorable
     item in their sector would otherwise show as a confident zero. */
  const axisLabels = [
    ...new Set(
      pool
        .filter(isScorable)
        .map((item) => item.axis)
        .filter((axis): axis is string => Boolean(axis)),
    ),
  ];

  const axes = axisLabels
    .map((label) => {
      const items = pool.filter((item) => item.axis === label && isScorable(item));
      return { label, score: ratio(items, answers, byId), count: items.length };
    })
    .filter((axis) => axis.count > 0)
    .map(({ label, score: value }) => ({ label, score: value }));

  const overall = Math.round(
    SECTION_ORDER.reduce((sum, section) => sum + (sections[section] ?? 0) * SECTION_WEIGHTS[section], 0),
  );

  return { overall, sections, axes };
}

/**
 * Mean score across the items offered, out of 100.
 *
 * Keyed items give 100 or 0. Ordinal items give their position on the scale, so
 * a candidate who supervised a team scores higher than one who worked alone,
 * without either answer being wrong.
 *
 * An unanswered item scores zero either way, deliberately: skipping is a choice,
 * and counting only what was attempted would reward selective guessing.
 */
function ratio(items: readonly Item[], answers: AnswerMap, byId: Map<string, Item>): number {
  if (items.length === 0) return 0;

  let total = 0;
  for (const item of items) {
    const given = answers[item.id];
    if (given === undefined) continue;

    const definition = byId.get(item.id);
    if (!definition) continue;

    if (definition.correct !== undefined) {
      if (given === definition.correct) total += 100;
      continue;
    }

    if (definition.scale) {
      const steps = definition.options.length - 1;
      if (steps > 0) total += (Math.min(given, steps) / steps) * 100;
    }
  }

  return Math.round(total / items.length);
}

/**
 * Maps a raw English percentage to a CEFR band.
 *
 * Placeholder thresholds, and the report must not present this as a certified
 * level. `docs/english-assessment.md` covers why the level an employer sees has
 * to come from a recognised provider.
 */
export function cefrFromScore(englishScore: number): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' {
  if (englishScore >= 90) return 'C1';
  if (englishScore >= 75) return 'B2';
  if (englishScore >= 55) return 'B1';
  if (englishScore >= 35) return 'A2';
  return 'A1';
}
