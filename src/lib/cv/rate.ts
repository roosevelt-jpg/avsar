import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { anthropic, CV_MODEL, PROMPT_VERSION } from './client';
import { ratingSchema, type Rating } from './schema';
import { rubricFor, weightedOverall, RUBRIC_VERSION } from './rubric';
import type { RatingInput } from './redact';
import type { SectorSlug } from '@/lib/data/sectors';

/**
 * Pass 2: score the redacted profile against the sector rubric.
 *
 * This pass never receives identity. See redact.ts for what is withheld and why.
 * The output is a suggestion with evidence attached, never a decision: a person
 * records the decision, which is both an AI Act obligation and the only way the
 * rubric ever improves.
 */

const SYSTEM = `You assess a redacted candidate profile against a rubric, for a recruiter who will make the actual decision. You are producing a recommendation with its evidence, not a verdict.

The profile has had name, contact details, age, date of birth, gender, marital status, religion, caste and nationality removed before it reached you. Do not attempt to infer any of them, and do not let an employer or institution name stand in for them. If you find yourself reasoning about where someone is from, stop: that is not a criterion.

Rules:
- Score every criterion in the rubric you are given, using its id exactly as written.
- Every score must carry evidence: direct quotes or close paraphrases from the profile. A criterion you cannot evidence gets a low confidence and a reasoning line saying what is missing, not a guessed score.
- Absence of evidence is not negative evidence. A CV that does not mention a safety certificate is not a candidate without one; score confidence low and say so.
- Short tenures, contract work and seasonal work are normal in these sectors. Do not treat them as instability unless the pattern is both unexplained and pronounced.
- An employment gap is not a defect. Note it if it is long and unexplained, and leave the interpretation to the recruiter.
- Judge the work described, not the seniority of the job title. Titles are inconsistent across employers and countries.
- Set requiresHumanAttention when the profile is internally contradictory, when the document was partly unreadable, when the evidence is too thin to score most criteria, or when something about the case will not be captured by a number.`;

export type RatingResult = {
  rating: Rating;
  /** Recomputed from the criterion scores and the rubric weights, not taken from the model. */
  weightedScore: number;
  usage: { inputTokens: number; outputTokens: number };
  model: string;
  promptVersion: string;
  rubricVersion: string;
};

export async function rateProfile(
  profile: RatingInput,
  sector: SectorSlug,
): Promise<RatingResult> {
  const rubric = rubricFor(sector);

  const response = await anthropic().messages.parse({
    model: CV_MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: [
              `Sector: ${sector}`,
              '',
              'Rubric:',
              ...rubric.map((c) => `- ${c.id} (${c.label}): ${c.definition}`),
              '',
              'Redacted profile:',
              JSON.stringify(profile, null, 2),
            ].join('\n'),
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(ratingSchema) },
  });

  if (!response.parsed_output) {
    throw new Error(`Rating returned no parsed output (stop_reason: ${response.stop_reason})`);
  }

  const rating = response.parsed_output;

  return {
    rating,
    /* The weighted score is computed here so the weights are auditable and can
       be changed without re-running the model. */
    weightedScore: weightedOverall(sector, rating.criteria),
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    model: CV_MODEL,
    promptVersion: PROMPT_VERSION,
    rubricVersion: RUBRIC_VERSION,
  };
}
