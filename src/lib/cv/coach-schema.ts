import * as z from 'zod/v4';

/**
 * The career pack: what a candidate takes away from the assessment.
 *
 * The array caps are tolerances, not the target. `messages.parse()` throws when
 * the model returns one item more than the maximum, which discards a whole
 * generation: the first real call to this threw away fifty seconds and a paid
 * request because it produced five strengths instead of four. So the schema
 * allows some slack, the prompt states the number wanted, and `trimPack` cuts
 * the result to the length the UI is built for.
 *
 * This is the part of the fee with value independent of any placement. It has
 * to be genuinely useful to someone who is never selected, and portable enough
 * to use with any employer anywhere.
 */

export const cvBulletSchema = z.object({
  text: z.string().describe('One achievement line, starting with a verb'),
  /**
   * Which source line this came from. Required, and the reason the rewrite
   * cannot invent: every bullet has to point at something the candidate
   * actually wrote or answered.
   */
  basedOn: z.string().describe('The exact phrase from the source this is a rewrite of'),
});

export const improvedCvSchema = z.object({
  headline: z.string().describe('One line: role and years, no adjectives'),
  summary: z.string().describe('Three to four sentences, first person, plain language'),
  experience: z.array(
    z.object({
      employer: z.string(),
      title: z.string(),
      period: z.string(),
      bullets: z.array(cvBulletSchema).max(5),
    }),
  ),
  skills: z.array(z.string()).max(18),
  languages: z.array(z.string()),
  education: z.array(z.string()),
});

export const careerPackSchema = z.object({
  /** What the candidate should lead with, drawn from the assessment. */
  strengths: z.array(
    z.object({
      title: z.string(),
      why: z.string().describe('Why an employer in this sector values it'),
      evidence: z.string().describe('What in their profile or score shows it'),
    }),
  ).max(6),

  /** Gaps, written as actions rather than verdicts. */
  improvements: z.array(
    z.object({
      area: z.string(),
      action: z.string().describe('Something they can start this month, specific and free or cheap'),
      payoff: z.string().describe('What it changes for them, concretely'),
    }),
  ).max(7),

  interview: z.object({
    leadWith: z.array(z.string()).max(5).describe('What to raise early and unprompted'),
    questions: z.array(
      z.object({
        question: z.string().describe('A question they are likely to be asked for this role'),
        approach: z.string().describe('How to answer it well, using their own experience'),
      }),
    ).max(7),
    /** What they will be asked that they are least ready for. */
    prepareFor: z.array(z.string()).max(5),
    askThem: z.array(z.string()).max(5).describe('Questions worth asking the employer'),
  }),

  improvedCv: improvedCvSchema,

  /**
   * The advice, in the candidate's own language.
   *
   * The CV stays in English because it goes to a Portuguese employer. Advice
   * about their own career does not: someone reads guidance better in the
   * language they think in, and this is the part they act on.
   *
   * Empty when the candidate's locale is already English.
   */
  translated: z
    .object({
      language: z.string().describe('Language name in English, e.g. Hindi'),
      strengths: z.array(z.object({ title: z.string(), why: z.string() })).max(6),
      improvements: z.array(z.object({ area: z.string(), action: z.string() })).max(7),
      leadWith: z.array(z.string()).max(5),
      questions: z.array(z.object({ question: z.string(), approach: z.string() })).max(7),
    })
    .nullable(),
});

export type CareerPack = z.infer<typeof careerPackSchema>;

/** The lengths the pages are actually built for. */
const LIMITS = {
  strengths: 4,
  improvements: 5,
  leadWith: 3,
  questions: 5,
  prepareFor: 3,
  askThem: 3,
} as const;

/** Cut a generation back to those lengths rather than rejecting it. */
export function trimPack(pack: CareerPack): CareerPack {
  return {
    ...pack,
    strengths: pack.strengths.slice(0, LIMITS.strengths),
    improvements: pack.improvements.slice(0, LIMITS.improvements),
    interview: {
      ...pack.interview,
      leadWith: pack.interview.leadWith.slice(0, LIMITS.leadWith),
      questions: pack.interview.questions.slice(0, LIMITS.questions),
      prepareFor: pack.interview.prepareFor.slice(0, LIMITS.prepareFor),
      askThem: pack.interview.askThem.slice(0, LIMITS.askThem),
    },
    translated: pack.translated
      ? {
          ...pack.translated,
          strengths: pack.translated.strengths.slice(0, LIMITS.strengths),
          improvements: pack.translated.improvements.slice(0, LIMITS.improvements),
          leadWith: pack.translated.leadWith.slice(0, LIMITS.leadWith),
          questions: pack.translated.questions.slice(0, LIMITS.questions),
        }
      : null,
  };
}
