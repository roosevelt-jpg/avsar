import { SECTION_ORDER, type SectionId } from '@/lib/assessment/items';
import { getAdminSupabase } from '@/lib/supabase/admin';

/**
 * What a candidate has actually done.
 *
 * The dashboard used to show a fixed timeline from the prototype: "Assessment
 * completed, 5 Oct 2026", to everyone, always, including people who had not
 * started. This replaces it with the truth.
 */

export type StepState = 'done' | 'current' | 'todo';

export type CandidateStatus = {
  paid: boolean;
  profileComplete: boolean;
  cvUploaded: boolean;
  sectionsDone: SectionId[];
  sectionsTotal: number;
  nextSection: SectionId | null;
  assessmentComplete: boolean;
  reportReady: boolean;
  steps: { key: string; state: StepState }[];
};

export async function getCandidateStatus(
  candidateId: string,
  paymentStatus: string,
): Promise<CandidateStatus> {
  const admin = getAdminSupabase();

  const paid = paymentStatus === 'paid';
  let sectionsDone: SectionId[] = [];
  let reportReady = false;
  let profileComplete = false;
  let cvUploaded = false;

  if (admin) {
    const [attempts, report, profile, documents] = await Promise.all([
      admin.from('assessment_attempts').select('section, submitted_at').eq('candidate_id', candidateId),
      admin.from('reports').select('candidate_id').eq('candidate_id', candidateId).maybeSingle(),
      admin.from('candidate_profiles').select('completed_at').eq('candidate_id', candidateId).maybeSingle(),
      admin.from('cv_documents').select('id').eq('candidate_id', candidateId).limit(1),
    ]);

    const submitted = new Set(
      (attempts.data ?? []).filter((a) => a.submitted_at).map((a) => a.section as SectionId),
    );
    sectionsDone = SECTION_ORDER.filter((section) => submitted.has(section));
    reportReady = Boolean(report.data);
    profileComplete = Boolean(profile.data?.completed_at);
    cvUploaded = (documents.data ?? []).length > 0;
  }

  const nextSection = SECTION_ORDER.find((section) => !sectionsDone.includes(section)) ?? null;
  const assessmentComplete = nextSection === null;

  /* One ordered list, so the dashboard renders state rather than deciding it. */
  const steps: { key: string; state: StepState }[] = [
    { key: 'registered', state: paid ? 'done' : 'current' },
    { key: 'profile', state: profileComplete || cvUploaded ? 'done' : paid ? 'current' : 'todo' },
    {
      key: 'assessment',
      state: assessmentComplete
        ? 'done'
        : sectionsDone.length > 0 || (paid && (profileComplete || cvUploaded))
          ? 'current'
          : 'todo',
    },
    { key: 'report', state: reportReady ? 'done' : assessmentComplete ? 'current' : 'todo' },
    { key: 'selection', state: 'todo' },
  ];

  return {
    paid,
    profileComplete,
    cvUploaded,
    sectionsDone,
    sectionsTotal: SECTION_ORDER.length,
    nextSection,
    assessmentComplete,
    reportReady,
    steps,
  };
}
