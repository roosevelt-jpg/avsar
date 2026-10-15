import type { DocumentKind } from '@/lib/relocation/documents';

/**
 * From signed contract to first shift in Portugal, as steps with dates.
 *
 * The plan is created when a recruiter starts it for a hired application.
 * Due dates are offsets from that day and are a starting point the recruiter
 * edits, not a promise: embassy processing times vary by months. Arrival,
 * accommodation check-in and the first day are milestones too, so a missed
 * arrival shows up in the same overdue list as a missed visa appointment.
 * Client-safe.
 */

export const MILESTONE_STATUSES = ['pending', 'in_progress', 'blocked', 'done', 'skipped'] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export type MilestoneTemplate = {
  key: string;
  label: string;
  /** What the candidate reads: what this is and what they do. */
  candidateText: string;
  offsetDays: number;
  documents?: DocumentKind[];
  /** Arrival steps: a miss is urgent, not just late. */
  arrival?: boolean;
};

export const MILESTONE_TEMPLATE: MilestoneTemplate[] = [
  { key: 'contract_signed', label: 'Contract signed', candidateText: 'You and the employer sign the employment contract. It is the basis of your visa.', offsetDays: 7, documents: ['contract'] },
  { key: 'documents_ready', label: 'Visa documents checked', candidateText: 'Upload your documents. We check each one before anything is submitted.', offsetDays: 28, documents: ['passport', 'police_clearance', 'photo', 'insurance', 'accommodation'] },
  { key: 'visa_appointment', label: 'Visa centre appointment', candidateText: 'You give biometrics and submit the application at the visa centre. We book it with you.', offsetDays: 42 },
  { key: 'visa_issued', label: 'Visa issued', candidateText: 'The embassy decides. This usually takes one to three months; we follow it for you.', offsetDays: 100 },
  { key: 'flight_booked', label: 'Flight booked', candidateText: 'Your travel date is agreed with the employer and the ticket is booked.', offsetDays: 110 },
  { key: 'arrived', label: 'Arrived in Portugal', candidateText: 'Tell us when you land. Someone is expecting you.', offsetDays: 120, arrival: true },
  { key: 'accommodation_checkin', label: 'Moved into accommodation', candidateText: 'You have the keys and a place to sleep.', offsetDays: 120, arrival: true },
  { key: 'first_day', label: 'First day at work', candidateText: 'Your first shift.', offsetDays: 122, arrival: true },
  { key: 'nif', label: 'Tax number (NIF)', candidateText: 'Needed for your contract, bank and rent. We go with you.', offsetDays: 127 },
  { key: 'niss', label: 'Social security (NISS)', candidateText: 'Your entitlements, recorded from your first month.', offsetDays: 134 },
  { key: 'bank_account', label: 'Bank account', candidateText: 'So your salary arrives safely.', offsetDays: 134 },
  { key: 'sns', label: 'Health number (SNS)', candidateText: 'Register at your local health centre.', offsetDays: 150 },
  { key: 'aima_residence', label: 'Residence permit (AIMA)', candidateText: 'The appointment with AIMA, the immigration agency, for your residence permit. We help you prepare.', offsetDays: 210 },
];

export function milestoneTemplate(key: string): MilestoneTemplate | undefined {
  return MILESTONE_TEMPLATE.find((m) => m.key === key);
}

/** Rows to insert for a new plan starting on `start` (YYYY-MM-DD). */
export function planFrom(start: string): { key: string; position: number; due_on: string }[] {
  const base = Date.parse(`${start}T00:00:00Z`);
  return MILESTONE_TEMPLATE.map((m, index) => ({
    key: m.key,
    position: index + 1,
    due_on: new Date(base + m.offsetDays * 86_400_000).toISOString().slice(0, 10),
  }));
}

export type Milestone = {
  id: string;
  key: string;
  position: number;
  status: MilestoneStatus;
  dueOn: string | null;
  blocker: string | null;
  doneAt: string | null;
};

const OPEN: MilestoneStatus[] = ['pending', 'in_progress', 'blocked'];

export function isOverdue(milestone: Pick<Milestone, 'status' | 'dueOn'>, today = new Date().toISOString().slice(0, 10)): boolean {
  return OPEN.includes(milestone.status) && milestone.dueOn !== null && milestone.dueOn < today;
}

/** The first step not finished, which is what the candidate should look at. */
export function nextMilestone<T extends Pick<Milestone, 'status' | 'position'>>(milestones: T[]): T | undefined {
  return [...milestones].sort((a, b) => a.position - b.position).find((m) => OPEN.includes(m.status));
}

export function progress(milestones: Pick<Milestone, 'status'>[]): { done: number; total: number } {
  const counted = milestones.filter((m) => m.status !== 'skipped');
  return { done: counted.filter((m) => m.status === 'done').length, total: counted.length };
}
