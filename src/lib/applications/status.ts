/**
 * Application stages. Client-safe.
 *
 * Two vocabularies on purpose: the console uses the recruiter's words, and the
 * candidate sees a plain sentence about what is happening and what happens
 * next. "Screening" means nothing to somebody in Kochi waiting to hear back;
 * "Our team is reading your application" does.
 */

export const APPLICATION_STATUSES = [
  'submitted',
  'screening',
  'shortlisted',
  'interview',
  'offer',
  'hired',
  'visa_processing',
  'relocated',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

/** The happy path, in order. The tracker draws these as steps. */
export const PIPELINE: ApplicationStatus[] = [
  'submitted',
  'screening',
  'shortlisted',
  'interview',
  'offer',
  'visa_processing',
  'relocated',
];

export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; candidateTitle: string; candidateBody: string; tone: 'neutral' | 'progress' | 'success' | 'stopped' }
> = {
  submitted: {
    label: 'Submitted',
    candidateTitle: 'Application received',
    candidateBody: 'We have your application. A recruiter will read it within a few working days.',
    tone: 'neutral',
  },
  screening: {
    label: 'Screening',
    candidateTitle: 'Being reviewed',
    candidateBody: 'A recruiter is reading your profile and answers against what the employer needs.',
    tone: 'progress',
  },
  shortlisted: {
    label: 'Shortlisted',
    candidateTitle: 'Shortlisted',
    candidateBody: 'Your profile has been put forward to the employer. We will contact you to arrange an interview.',
    tone: 'progress',
  },
  interview: {
    label: 'Interview',
    candidateTitle: 'Interview stage',
    candidateBody: 'The employer wants to speak with you. Check your email and WhatsApp for the time and link.',
    tone: 'progress',
  },
  offer: {
    label: 'Offer',
    candidateTitle: 'Offer made',
    candidateBody: 'The employer has made an offer. Your recruiter will go through the contract with you before you sign anything.',
    tone: 'success',
  },
  hired: {
    label: 'Hired',
    candidateTitle: 'Offer accepted',
    candidateBody: 'Congratulations. Next comes your work visa; we will send the document checklist.',
    tone: 'success',
  },
  visa_processing: {
    label: 'Visa processing',
    candidateTitle: 'Visa in progress',
    candidateBody: 'Your work visa application is being prepared and submitted. Timings depend on the consulate; we will update you at each step.',
    tone: 'success',
  },
  relocated: {
    label: 'Relocated',
    candidateTitle: 'Welcome to Portugal',
    candidateBody: 'You have arrived and started work. Your recruiter remains your contact for the first months.',
    tone: 'success',
  },
  rejected: {
    label: 'Not progressed',
    candidateTitle: 'Not taken forward',
    candidateBody: 'The employer has chosen other candidates for this role. Your profile stays active and you can apply to other jobs.',
    tone: 'stopped',
  },
  withdrawn: {
    label: 'Withdrawn',
    candidateTitle: 'Withdrawn',
    candidateBody: 'You withdrew this application. You can apply again while the job is open.',
    tone: 'stopped',
  },
};

/** Which stage of the pipeline a status sits at, for the progress bar. */
export function pipelineIndex(status: ApplicationStatus): number {
  if (status === 'hired') return PIPELINE.indexOf('offer');
  return PIPELINE.indexOf(status);
}

export function canWithdraw(status: ApplicationStatus): boolean {
  return !['hired', 'visa_processing', 'relocated', 'rejected', 'withdrawn'].includes(status);
}
