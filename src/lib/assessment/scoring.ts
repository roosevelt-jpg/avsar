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
 * Items a candidate in this sector could have been shown.
 *
 * Scoping by sector matters now that the bank spans six trades: without it, a
 * housekeeper is marked against questions about scaffolding they were never
 * asked, and every score collapses.
 */
function visibleItems(sector: SectorSlug): Item[] {
  return ITEM_BANK.filter((item) => item.sector === undefined || item.sector === sector);
}

export function score(answers: AnswerMap, sector: SectorSlug): ScoreResult {
  const pool = visibleItems(sector);
  const byId = new Map<string, Item>(pool.map((item) => [item.id, item]));

  const sections = {} as Record<SectionId, number>;
  for (const section of SECTION_ORDER) {
    const scorable = pool.filter((item) => item.section === section && item.correct !== undefined);
    sections[section] = ratio(scorable, answers, byId);
  }

  /* Only axes the candidate was actually assessed on. An axis with no scorable
     item in their sector would otherwise show as a confident zero. */
  const axisLabels = [
    ...new Set(
      pool
        .filter((item) => item.correct !== undefined)
        .map((item) => item.axis)
        .filter((axis): axis is string => Boolean(axis)),
    ),
  ];

  const axes = axisLabels
    .map((label) => {
      const items = pool.filter((item) => item.axis === label && item.correct !== undefined);
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
 * Share correct out of everything scorable that was offered.
 *
 * An unanswered question counts as wrong, deliberately: skipping is a choice,
 * and scoring only what was attempted would reward guessing selectively.
 */
function ratio(items: readonly Item[], answers: AnswerMap, byId: Map<string, Item>): number {
  if (items.length === 0) return 0;
  let correct = 0;
  for (const item of items) {
    const given = answers[item.id];
    const key = byId.get(item.id)?.correct;
    if (given !== undefined && key !== undefined && given === key) correct += 1;
  }
  return Math.round((correct / items.length) * 100);
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
