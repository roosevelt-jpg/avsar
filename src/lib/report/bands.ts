import type { Dictionary } from '@/lib/i18n';

/**
 * The words that sit under a number on a report.
 *
 * They were fixed strings in the dictionary, so every candidate's report said
 * "Independent user" and "Strong" whatever they actually scored: someone who
 * scored zero was told their skills were strong, and an A1 speaker was called
 * an independent user, which A1 is by definition not.
 *
 * This report is downloaded by the candidate, shown to employers and ends up in
 * an immigration file. A descriptive word printed under a number is read as a
 * statement about the person, so it has to come from the number.
 */

/** The CEFR's own three bands. A1-A2 basic, B1-B2 independent, C1-C2 proficient. */
export function englishBand(cefr: string, t: Dictionary): string {
  const level = cefr.trim().toUpperCase();
  if (level.startsWith('C')) return t.dash.englishProficient;
  if (level.startsWith('B')) return t.dash.englishIndependent;
  return t.dash.englishBasic;
}

/**
 * Skill bands.
 *
 * Four, because three flatters the middle and five implies a precision a
 * twenty-question assessment does not have. The lowest band is named for what
 * it is without being an insult: this word is read by the person it describes.
 */
export function skillBand(score: number, t: Dictionary): string {
  if (score >= 80) return t.dash.bandExcellent;
  if (score >= 60) return t.dash.bandStrong;
  if (score >= 40) return t.dash.bandFair;
  return t.dash.bandDeveloping;
}
