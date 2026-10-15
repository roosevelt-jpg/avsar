/* Vocabulary only, no server imports, so client components can use it. */

export const LEAD_STATUSES = ['new', 'open', 'replied', 'closed'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_TOPICS = ['candidate', 'employer', 'scam_report', 'privacy', 'other'] as const;
export type LeadTopic = (typeof LEAD_TOPICS)[number];

export const LEAD_KINDS = ['contact', 'import', 'privacy'] as const;
export type LeadKind = (typeof LEAD_KINDS)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  open: 'Open',
  replied: 'Replied',
  closed: 'Closed',
};

export const LEAD_STATUS_TONE: Record<LeadStatus, 'accent' | 'neutral' | 'success' | 'muted'> = {
  new: 'accent',
  open: 'neutral',
  replied: 'success',
  closed: 'muted',
};

export const LEAD_TOPIC_LABELS: Record<LeadTopic, string> = {
  candidate: 'Candidate question',
  employer: 'Employer enquiry',
  scam_report: 'Fee or scam report',
  privacy: 'Privacy request',
  other: 'Other',
};

export const LEAD_KIND_LABELS: Record<LeadKind, string> = {
  contact: 'Contact form',
  import: 'Imported',
  privacy: 'Privacy request',
};

export type Lead = {
  id: string;
  kind: LeadKind;
  status: LeadStatus;
  topic: LeadTopic;
  fullName: string;
  email: string | null;
  phone: string | null;
  whatsappOk: boolean;
  message: string | null;
  position: string | null;
  city: string | null;
  company: string | null;
  openings: number | null;
  source: string | null;
  candidateId: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadEvent = {
  id: number;
  kind: 'note' | 'email' | 'whatsapp' | 'status';
  body: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  actor: string | null;
  createdAt: string;
};
