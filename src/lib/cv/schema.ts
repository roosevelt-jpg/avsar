/**
 * Schemas for the two-pass CV pipeline.
 *
 * Imported from `zod/v4` because that is what `@anthropic-ai/sdk/helpers/zod`
 * expects. `src/lib/validation.ts` stays on the classic `zod` import; the two
 * coexist fine.
 *
 * Pass 1 (extraction) sees the whole document, including identity, because
 * identity is needed to cross-check the self-reported profile and to catch
 * duplicate applications.
 *
 * Pass 2 (rating) sees only what `toRatingInput` lets through. See redact.ts.
 */

import * as z from 'zod/v4';

/* --------------------------------------------------------------- pass 1 --- */

export const roleSchema = z.object({
  employer: z.string().describe('Employer name exactly as written'),
  title: z.string(),
  /** ISO YYYY-MM when the CV gives enough detail, otherwise YYYY. */
  startDate: z.string().describe('YYYY-MM or YYYY. Empty string if absent.'),
  endDate: z.string().describe('YYYY-MM, YYYY, or empty if this is the current role'),
  isCurrent: z.boolean(),
  country: z.string().describe('Country of the role, or empty if not stated'),
  responsibilities: z.array(z.string()).describe('Duties as stated, not inferred'),
});

export const employmentGapSchema = z.object({
  from: z.string(),
  to: z.string(),
  months: z.number().int(),
});

/**
 * Attributes that must never reach the rating pass. Extracted only so they can
 * be deliberately excluded, and so a reviewer can see what the document
 * contained. Indian CVs commonly volunteer several of these unprompted.
 */
export const protectedAttributesSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  dateOfBirth: z.string().describe('As written, or empty'),
  statedAge: z.string(),
  statedGender: z.string(),
  maritalStatus: z.string(),
  religionOrCaste: z.string().describe('Only if the document volunteers it'),
  nationality: z.string(),
  hasPhoto: z.boolean(),
  /**
   * Everything else personal the document volunteers.
   *
   * Indian CVs routinely add a father's or husband's name, a home address, a
   * caste, a height, a photograph. There is no field for most of it and there
   * should not be, but it has to land somewhere: the first real CV through this
   * pipeline carried a father's name and a home address, and because the schema
   * had nowhere to put them the model mentioned them in its free-text notes
   * instead, which carried them past the redaction boundary.
   *
   * Captured here so they can be removed deterministically rather than by
   * hoping the model keeps quiet. Each entry is the value exactly as written.
   */
  otherPersonalDetails: z
    .array(z.string())
    .describe('Any other personal detail the document volunteers, value as written'),
});

export const extractionSchema = z.object({
  protectedAttributes: protectedAttributesSchema,
  roles: z.array(roleSchema),
  totalYearsExperience: z
    .number()
    .describe('Computed from the role dates, excluding overlaps. 0 if undeterminable.'),
  education: z.array(
    z.object({
      institution: z.string(),
      qualification: z.string(),
      field: z.string(),
      year: z.string(),
    }),
  ),
  certifications: z.array(
    z.object({ name: z.string(), issuer: z.string(), year: z.string() }),
  ),
  languages: z.array(
    z.object({
      language: z.string(),
      statedLevel: z.string().describe('As claimed in the document, not assessed'),
    }),
  ),
  skills: z.array(z.string()),
  employmentGaps: z.array(employmentGapSchema),
  documentQuality: z.enum(['clear', 'partially_legible', 'illegible']),
  extractionNotes: z
    .array(z.string())
    .describe('Anything a human reviewer should know: contradictions, unreadable sections'),
});

export type Extraction = z.infer<typeof extractionSchema>;

/* --------------------------------------------------------------- pass 2 --- */

export const criterionScoreSchema = z.object({
  id: z.string().describe('Criterion id from the rubric, copied exactly'),
  score: z.number().int().min(0).max(100),
  /**
   * Required. A score with no evidence is not reviewable, and under the AI Act
   * a reviewer has to be able to see why the system said what it said.
   */
  evidence: z
    .array(z.string())
    .describe('Direct quotes or close paraphrases from the profile that justify this score'),
  confidence: z.enum(['low', 'medium', 'high']),
  reasoning: z.string(),
});

export const ratingSchema = z.object({
  criteria: z.array(criterionScoreSchema),
  suggestedOverall: z.number().int().min(0).max(100),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  roleFit: z.object({
    verdict: z.enum(['strong', 'adequate', 'weak', 'unsuitable']),
    reasoning: z.string(),
  }),
  /**
   * The model's own flag that this case should not be triaged on the score
   * alone. Cheap to ask for, and it surfaces the odd cases a threshold hides.
   */
  requiresHumanAttention: z.boolean(),
  attentionReasons: z.array(z.string()),
});

export type Rating = z.infer<typeof ratingSchema>;

/* ------------------------------------------------------------ discrepancy --- */

export type Discrepancy = {
  field: string;
  selfReported: string;
  fromDocument: string;
  severity: 'info' | 'review' | 'serious';
};
