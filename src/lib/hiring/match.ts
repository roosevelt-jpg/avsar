import { cefrRank, type Cefr } from '@/lib/data/candidates';
import { scoreKinds } from '@/lib/relocation/documents';

/**
 * How well one candidate fits one job, out of 100, with the reasons.
 *
 * A guide for the person deciding, never a decision: it ranks a list so the
 * likely fits are read first, and every point comes with a sentence saying
 * where it came from, so a recruiter or employer can disagree with it. Inputs
 * are facts we hold (position, assessed English, experience, the assessment
 * score, a verified visa file), not anything inferred about the person. Pure
 * and client-safe.
 */

export type MatchJob = {
  position: string | null;
  sector: string | null;
  minEnglish: Cefr | null;
  /** Years of experience the job asks for, if it says. */
  minYears?: number | null;
};

export type MatchCandidate = {
  position: string | null;
  sector: string | null;
  english: Cefr | null;
  /** Upper bound of the experience band, in years. */
  yearsExperience: number | null;
  overallScore: number | null;
  verifiedDocuments: readonly string[];
};

export type MatchPart = { label: string; points: number; max: number; reason: string };
export type MatchResult = { score: number; parts: MatchPart[] };

export function matchScore(job: MatchJob, candidate: MatchCandidate): MatchResult {
  const parts: MatchPart[] = [];

  /* Role: the same position is the strongest signal; the same sector still counts. */
  if (job.position && candidate.position === job.position) {
    parts.push({ label: 'Role', points: 30, max: 30, reason: 'Applied for this exact role.' });
  } else if (job.sector && candidate.sector === job.sector) {
    parts.push({ label: 'Role', points: 18, max: 30, reason: 'Works in the same sector.' });
  } else {
    parts.push({ label: 'Role', points: 0, max: 30, reason: 'Different role and sector.' });
  }

  /* English: at or above the minimum is full marks; each level short costs half. */
  if (!candidate.english) {
    parts.push({ label: 'English', points: 0, max: 25, reason: 'English not assessed yet.' });
  } else if (!job.minEnglish || cefrRank(candidate.english) >= cefrRank(job.minEnglish)) {
    parts.push({ label: 'English', points: 25, max: 25, reason: `Assessed at ${candidate.english}${job.minEnglish ? `, meets ${job.minEnglish}` : ''}.` });
  } else {
    const short = cefrRank(job.minEnglish) - cefrRank(candidate.english);
    parts.push({ label: 'English', points: Math.max(0, 25 - short * 12), max: 25, reason: `Assessed at ${candidate.english}, below the ${job.minEnglish} asked for.` });
  }

  /* Experience. */
  const years = candidate.yearsExperience;
  const wanted = job.minYears ?? 2;
  if (years == null) {
    parts.push({ label: 'Experience', points: 0, max: 15, reason: 'Experience not stated.' });
  } else if (years >= wanted) {
    parts.push({ label: 'Experience', points: 15, max: 15, reason: `About ${years} years, enough for this role.` });
  } else {
    parts.push({ label: 'Experience', points: Math.round((15 * years) / Math.max(wanted, 1)), max: 15, reason: `About ${years} years, under the ${wanted} this role needs.` });
  }

  /* The skills assessment, scaled. */
  const assessed = candidate.overallScore;
  parts.push(
    assessed == null
      ? { label: 'Assessment', points: 0, max: 20, reason: 'Assessment not taken.' }
      : { label: 'Assessment', points: Math.round((Math.max(0, Math.min(100, assessed)) * 20) / 100), max: 20, reason: `Scored ${assessed} out of 100.` },
  );

  /* Visa file: a verified file means the hire can travel sooner. */
  const readiness = scoreKinds(candidate.verifiedDocuments);
  parts.push({
    label: 'Visa file',
    points: Math.round(readiness.score / 10),
    max: 10,
    reason: readiness.ready ? 'Visa file verified and complete.' : readiness.verified.length ? `${readiness.verified.length} documents verified.` : 'No documents verified yet.',
  });

  return { score: parts.reduce((sum, p) => sum + p.points, 0), parts };
}
