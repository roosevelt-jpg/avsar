/**
 * Scoring. SERVER ONLY, because it reads the answer keys.
 *
 * This is deliberately simple: percentage correct per axis, then a weighted
 * overall. It is a working placeholder, not psychometrics. Before anything is
 * shown to an employer as a comparable score it needs item calibration
 * (difficulty and discrimination) and a defensible English measure from a
 * recognised provider.
 */

import { ITEM_BANK, SECTION_ORDER, type Item, type SectionId } from './items';

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

export function score(answers: AnswerMap): ScoreResult {
  const byId = new Map<string, Item>(ITEM_BANK.map((item) => [item.id, item]));

  const sections = {} as Record<SectionId, number>;
  for (const section of SECTION_ORDER) {
    const scorable = ITEM_BANK.filter((item) => item.section === section && item.correct !== undefined);
    sections[section] = ratio(scorable, answers, byId);
  }

  const axisLabels = [...new Set(ITEM_BANK.map((item) => item.axis).filter((a): a is string => !!a))];
  const axes = axisLabels.map((label) => ({
    label,
    score: ratio(
      ITEM_BANK.filter((item) => item.axis === label && item.correct !== undefined),
      answers,
      byId,
    ),
  }));

  const overall = Math.round(
    SECTION_ORDER.reduce((sum, section) => sum + (sections[section] ?? 0) * SECTION_WEIGHTS[section], 0),
  );

  return { overall, sections, axes };
}

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
 * Placeholder thresholds. Replace with the provider's own mapping once the
 * English test is outsourced, and never present this as a certified level.
 */
export function cefrFromScore(englishScore: number): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' {
  if (englishScore >= 90) return 'C1';
  if (englishScore >= 75) return 'B2';
  if (englishScore >= 55) return 'B1';
  if (englishScore >= 35) return 'A2';
  return 'A1';
}
