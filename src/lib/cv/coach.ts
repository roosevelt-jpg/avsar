import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { anthropic, CV_MODEL, PROMPT_VERSION, isAiConfigured } from './client';
import { careerPackSchema, trimPack, type CareerPack } from './coach-schema';
import type { RatingInput } from './redact';
import { positionLabel } from '@/lib/data/positions';

/**
 * Generates the career pack. SERVER ONLY.
 *
 * This is what the fee buys that the candidate keeps: an improved CV, interview
 * preparation, and a development plan they can use with any employer, whether
 * or not they are ever placed by us.
 *
 * Unlike the rating pass, this one is allowed to know who the candidate is: it
 * is writing a document for them, in their voice, about their own work. The
 * separation that matters elsewhere does not apply to a service delivered back
 * to the person themselves.
 */

const SYSTEM = `You write career materials for a candidate who has just completed a skills assessment. Everything you produce belongs to them and must be useful even if they are never placed by us.

THE RULE THAT OVERRIDES EVERYTHING ELSE: never add experience, qualifications, certifications, employers, dates, responsibilities or achievements that are not in the source. You are rewriting, not embellishing. A CV that claims something the candidate cannot back up in an interview will cost them the job and may cost them a visa. Every bullet you write carries a basedOn field naming the exact source phrase it came from; if you cannot fill that honestly, do not write the bullet.

Within that rule, be genuinely useful:
- Rewrite weak lines into strong ones. "Responsible for cleaning rooms" becomes "Serviced 18 guest rooms per shift to a documented standard" ONLY if the numbers and the standard are in the source. If they are not, write "Serviced guest rooms to the hotel's documented standard" and leave the number out rather than inventing one.
- Prefer verbs and specifics over adjectives. Remove "hardworking", "team player", "dedicated". Employers discount them and they take space from real content.
- Write in plain English at a level the candidate could speak aloud in an interview. A CV in language they cannot reproduce in person hurts them.

For improvements, give actions they can start this month, that are free or nearly free, and that are realistic for someone working full time. "Improve your English" is useless. "Record yourself answering three interview questions in English and listen back" is not.

For interview preparation, use their actual experience. The questions should be the ones this role is really asked, and the approach should point at something specific in their history.

Write in the second person, directly to them. No preamble, no encouragement that is not earned by something in their record.

If you are asked for a translation, translate the strengths, the improvements and the interview guidance into that language, written to be read aloud naturally rather than word for word from the English. Do NOT translate the CV: it goes to a Portuguese employer and stays in English. Return null for the translation when the language asked for is English.`;

export type CoachInput = {
  fullName: string;
  position: string;
  /** Language for the advice. The CV stays in English regardless. */
  locale: string;
  profile: RatingInput;
  report: {
    overall: number;
    english: string;
    skills: number;
    experience: number;
    breakdown: { label: string; score: number }[];
  };
};

export type CoachResult = {
  pack: CareerPack;
  usage: { inputTokens: number; outputTokens: number };
  model: string;
  promptVersion: string;
};

export async function generateCareerPack(input: CoachInput): Promise<CoachResult> {
  if (!isAiConfigured()) throw new Error('ANTHROPIC_API_KEY is not set');

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
              `Candidate: ${input.fullName}`,
              `Applying for: ${positionLabel(input.position)}`,
              '',
              'Assessment result:',
              `  Overall ${input.report.overall}/100`,
              `  English ${input.report.english}`,
              `  Sector skills ${input.report.skills}/100`,
              `  Experience ${input.report.experience}/100`,
              ...input.report.breakdown.map((axis) => `  ${axis.label}: ${axis.score}/100`),
              '',
              'Their profile and work history, which is the only material you may draw on:',
              JSON.stringify(input.profile, null, 2),
              '',
              'How many of each: 3 or 4 strengths, 3 to 5 improvements, 3 to 5 interview questions, 3 to lead with, 3 to prepare for, 3 to ask them.',
              '',
              input.locale === 'hi'
                ? 'Also translate the strengths, improvements and interview guidance into Hindi. Leave the CV in English.'
                : 'No translation needed; return null for the translated field.',
            ].join('\n'),
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(careerPackSchema) },
  });

  if (!response.parsed_output) {
    throw new Error(`Career pack returned no parsed output (stop_reason: ${response.stop_reason})`);
  }

  return {
    /* Cut to the lengths the pages are built for. The schema allows a little
       more so that one item over does not throw away the whole generation. */
    pack: trimPack(response.parsed_output),
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    model: CV_MODEL,
    promptVersion: PROMPT_VERSION,
  };
}

/**
 * Bullets whose `basedOn` does not appear in the source.
 *
 * The prompt forbids invention; this checks it rather than trusting it. A
 * fabricated line on a CV costs the candidate an interview at best and a visa
 * application at worst, so it is worth verifying mechanically.
 */
export function unsupportedBullets(pack: CareerPack, profile: RatingInput): string[] {
  const haystack = JSON.stringify(profile).toLowerCase();

  const flagged: string[] = [];
  for (const role of pack.improvedCv.experience) {
    for (const bullet of role.bullets) {
      const source = bullet.basedOn.toLowerCase().trim();
      if (!source) {
        flagged.push(bullet.text);
        continue;
      }
      /* Loose containment: the model paraphrases, so an exact match would flag
         honest rewrites. Checking the longest few words catches invention
         without punishing rephrasing. */
      const words = source.split(/\W+/).filter((word) => word.length > 4);
      const anchor = words.sort((a, b) => b.length - a.length).slice(0, 2);
      if (anchor.length > 0 && !anchor.some((word) => haystack.includes(word))) {
        flagged.push(bullet.text);
      }
    }
  }
  return flagged;
}
