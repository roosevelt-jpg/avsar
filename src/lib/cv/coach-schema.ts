import * as z from 'zod/v4';

/**
 * The career pack: what a candidate takes away from the assessment.
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
  ).max(4),

  /** Gaps, written as actions rather than verdicts. */
  improvements: z.array(
    z.object({
      area: z.string(),
      action: z.string().describe('Something they can start this month, specific and free or cheap'),
      payoff: z.string().describe('What it changes for them, concretely'),
    }),
  ).max(5),

  interview: z.object({
    leadWith: z.array(z.string()).max(3).describe('What to raise early and unprompted'),
    questions: z.array(
      z.object({
        question: z.string().describe('A question they are likely to be asked for this role'),
        approach: z.string().describe('How to answer it well, using their own experience'),
      }),
    ).max(5),
    /** What they will be asked that they are least ready for. */
    prepareFor: z.array(z.string()).max(3),
    askThem: z.array(z.string()).max(3).describe('Questions worth asking the employer'),
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
      strengths: z.array(z.object({ title: z.string(), why: z.string() })).max(4),
      improvements: z.array(z.object({ area: z.string(), action: z.string() })).max(5),
      leadWith: z.array(z.string()).max(3),
      questions: z.array(z.object({ question: z.string(), approach: z.string() })).max(5),
    })
    .nullable(),
});

export type CareerPack = z.infer<typeof careerPackSchema>;
