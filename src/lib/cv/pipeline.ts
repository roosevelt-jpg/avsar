import crypto from 'node:crypto';
import { extractCv } from './extract';
import { rateProfile } from './rate';
import { toRatingInput, findDiscrepancies } from './redact';
import { isAiConfigured } from './client';
import type { Discrepancy, Extraction, Rating } from './schema';
import type { SectorSlug } from '@/lib/data/sectors';

/**
 * The whole assessment: extract, redact, rate, cross-check.
 *
 * The result is a recommendation. Nothing here decides anything about a
 * candidate; `cv_review_decisions` is where a decision gets recorded, by a
 * person, and until a row exists there the candidate has not been assessed in
 * any sense that matters.
 */

export type CvAssessment = {
  extraction: Extraction;
  rating: Rating;
  weightedScore: number;
  discrepancies: Discrepancy[];
  audit: {
    model: string;
    promptVersion: string;
    rubricVersion: string;
    /** Hash of the source document, so an assessment can be tied to exact bytes. */
    documentHash: string;
    inputTokens: number;
    outputTokens: number;
    assessedAt: string;
  };
};

export async function assessCv(input: {
  pdfBase64?: string;
  text?: string;
  sector: SectorSlug;
  selfReported: { fullName: string; email: string; yearsBand: number };
}): Promise<CvAssessment> {
  if (!isAiConfigured()) throw new Error('ANTHROPIC_API_KEY is not set');

  const source = input.pdfBase64 ?? input.text ?? '';
  const documentHash = crypto.createHash('sha256').update(source).digest('hex');

  const extracted = await extractCv({ pdfBase64: input.pdfBase64, text: input.text });

  /* The rating pass receives only what the allowlist in redact.ts permits. */
  const profile = toRatingInput(extracted.extraction);
  const rated = await rateProfile(profile, input.sector);

  return {
    extraction: extracted.extraction,
    rating: rated.rating,
    weightedScore: rated.weightedScore,
    discrepancies: findDiscrepancies(extracted.extraction, input.selfReported),
    audit: {
      model: rated.model,
      promptVersion: rated.promptVersion,
      rubricVersion: rated.rubricVersion,
      documentHash,
      inputTokens: extracted.usage.inputTokens + rated.usage.inputTokens,
      outputTokens: extracted.usage.outputTokens + rated.usage.outputTokens,
      assessedAt: new Date().toISOString(),
    },
  };
}

/**
 * Whether a case must be seen by a person before any triage on the score.
 *
 * Deliberately generous. The cost of a reviewer glancing at a case that did not
 * need it is minutes; the cost of a threshold quietly discarding a good
 * candidate is a person's year.
 */
export function needsReview(assessment: CvAssessment): boolean {
  return (
    assessment.rating.requiresHumanAttention ||
    assessment.discrepancies.some((d) => d.severity !== 'info') ||
    assessment.extraction.documentQuality !== 'clear' ||
    assessment.rating.criteria.some((c) => c.confidence === 'low') ||
    assessment.rating.criteria.some((c) => c.evidence.length === 0)
  );
}
