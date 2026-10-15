import { z } from 'zod';

/**
 * One interviewer's scorecard: a few criteria scored 1 to 5, a
 * recommendation, and a short summary. Shared by the staff and employer
 * routes and the form, so both sides score on the same scale and a hiring
 * decision can be compared across interviewers. Client-safe.
 */

export const RECOMMENDATIONS = ['advance', 'hold', 'reject'] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];
export const RECOMMENDATION_LABELS: Record<Recommendation, string> = { advance: 'Move forward', hold: 'Not sure yet', reject: 'Not a fit' };

export const DEFAULT_CRITERIA = ['Job knowledge', 'English for the job', 'Reliability and attitude', 'Fit with the team'];

export const scorecardSchema = z
  .object({
    criteria: z
      .array(z.object({ label: z.string().trim().min(1).max(60), score: z.number().int().min(1).max(5) }).strict())
      .min(1)
      .max(12),
    recommendation: z.enum(RECOMMENDATIONS),
    summary: z.string().trim().max(2000).optional().default(''),
  })
  .strict();

export type ScorecardInput = z.infer<typeof scorecardSchema>;

export function averageScore(criteria: { score: number }[]): number | null {
  if (criteria.length === 0) return null;
  return Math.round((criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length) * 10) / 10;
}
