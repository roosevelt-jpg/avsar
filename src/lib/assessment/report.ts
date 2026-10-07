/**
 * Turns stored answers into the report a candidate receives. SERVER ONLY:
 * it reads the answer key.
 *
 * The report is what the fee buys. The selection rules and the refund policy
 * both say so in as many words, so this is the one part of the product where
 * shipping something approximate would make the legal pages untrue.
 */

import { score, cefrFromScore, type AnswerMap } from './scoring';
import { CEFR, type Cefr } from '@/lib/data/candidates';
import type { SectorSlug } from '@/lib/data/sectors';

export type ReportRow = {
  overall_score: number;
  english_cefr: Cefr;
  english_rank: number;
  skills_score: number;
  experience_score: number;
  /**
   * `[{ label, score }]`, derived from the item bank's axes rather than from a
   * fixed list in the dictionary. The axes differ by sector, so a hardcoded set
   * of five labels would be wrong for a driver the moment we look.
   */
  breakdown: { label: string; score: number }[];
};

export function buildReport(
  answers: AnswerMap,
  sector: SectorSlug,
  position?: string,
): ReportRow {
  const result = score(answers, sector, position);
  const cefr = cefrFromScore(result.sections.english ?? 0);

  return {
    overall_score: result.overall,
    english_cefr: cefr,
    /* Denormalised so the talent-pool view can filter on English level without
       a join or a case expression. */
    english_rank: CEFR.indexOf(cefr),
    skills_score: result.sections.skills ?? 0,
    experience_score: result.sections.experience ?? 0,
    breakdown: result.axes.map((axis) => ({ label: axis.label, score: axis.score })),
  };
}
