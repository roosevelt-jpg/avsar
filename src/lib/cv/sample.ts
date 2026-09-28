import { RUBRIC_VERSION } from './rubric';
import type { SectorSlug } from '@/lib/data/sectors';

/**
 * A worked example of an assessment, so the review screen is reviewable before
 * any real CV or API key exists. Deliberately an imperfect case: thin evidence
 * on one criterion, a low-confidence score, and a years-of-experience
 * discrepancy, because those are what the screen has to handle well.
 */
export const SAMPLE_ASSESSMENT = {
  id: 'sample',
  sector: 'hospitality' as SectorSlug,
  suggestedScore: 74,
  roleFit: 'adequate',
  criteria: [
    {
      id: 'relevant_experience',
      score: 82,
      confidence: 'high' as const,
      reasoning:
        'Six years across two hotels, both in housekeeping with a move into a supervisory shift role in the most recent.',
      evidence: [
        'Housekeeping Supervisor, Taj Residency, 2022-2026',
        'Room Attendant, Hotel Grand Plaza, 2020-2022',
        'Responsible for allocating rooms across a team of six',
      ],
    },
    {
      id: 'stability',
      score: 78,
      confidence: 'high' as const,
      reasoning: 'Two employers in six years, no unexplained gaps.',
      evidence: ['2020-2022 and 2022-2026, continuous'],
    },
    {
      id: 'progression',
      score: 76,
      confidence: 'medium' as const,
      reasoning: 'Moved from room attendant to supervisor, with responsibility for a small team.',
      evidence: ['allocating rooms across a team of six', 'trained two new attendants'],
    },
    {
      id: 'documentation',
      score: 71,
      confidence: 'medium' as const,
      reasoning:
        'Employers and dates are named. No certification issuers given, so the hygiene training cannot be verified from the document.',
      evidence: ['Hygiene training (no issuer or year stated)'],
    },
    {
      id: 'guest_facing',
      score: 68,
      confidence: 'medium' as const,
      reasoning:
        'Guest contact is implied by the role but the document describes duties rather than guest interaction.',
      evidence: ['responded to guest requests during shift'],
    },
    {
      id: 'standards',
      score: 55,
      confidence: 'low' as const,
      reasoning:
        'The CV mentions hygiene training but names no standard, issuer or year. Absence of detail is not absence of the training; this needs asking about at interview.',
      evidence: [],
    },
  ],
  strengths: [
    'Six continuous years in hotel housekeeping with a clear step up in responsibility',
    'Has trained other staff, which transfers well to a team lead role',
  ],
  concerns: [
    'Hygiene and food safety training is claimed but not evidenced',
    'Little written detail on direct guest interaction',
  ],
  discrepancies: [
    {
      field: 'Years of experience',
      selfReported: '1-3 years',
      fromDocument: '6 years',
      severity: 'review' as const,
    },
  ],
  attentionReasons: [
    'One criterion could not be evidenced from the document',
    'Documented experience is materially higher than what was selected at sign-up',
  ],
  model: 'claude-opus-5',
  promptVersion: 'v1-2026-09',
  rubricVersion: RUBRIC_VERSION,
};
