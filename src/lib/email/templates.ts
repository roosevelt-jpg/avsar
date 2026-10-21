/**
 * The words of every email the platform sends, editable on Settings › Emails.
 *
 * Plain text with `{{placeholders}}`. A blank line starts a new paragraph.
 * Never HTML: the layout, colours and footer are fixed in template.ts, and
 * every value is escaped when the message is built.
 *
 * These are the starting texts a fresh database is seeded with. Hindi copies
 * of the verification and reminder emails are translations kept in code, like
 * the rest of the interface wording.
 */

export type EmailTemplate = {
  subject: string;
  heading: string;
  body: string;
  /** Button text. Empty means no button. */
  action: string;
};

export type EmailTemplateMeta = {
  id: EmailId;
  label: string;
  audience: 'Candidates' | 'Employers' | 'Leads' | 'Staff';
  description: string;
  placeholders: string[];
};

export const EMAIL_IDS = [
  'verification',
  'welcome_candidate',
  'welcome_employer',
  'password_reset',
  'reminder_profile',
  'reminder_assessment',
  'application_update',
  'interview_booked',
  'job_alerts',
  'newsletter_jobs',
  'reminder_package',
  'payment_received',
  'legal_review_ready',
  'document_reupload',
  'lead_reply',
  'employer_shortlist',
  'employer_unlock',
  'employer_job_live',
  'staff_alert',
] as const;
export type EmailId = (typeof EMAIL_IDS)[number];

export type EmailSettings = Record<EmailId, EmailTemplate>;

/** Available in every email, on top of each message's own placeholders. */
export const COMMON_PLACEHOLDERS = ['site_name', 'support_email', 'support_phone'];

export const EMAIL_META: EmailTemplateMeta[] = [
  { id: 'verification', label: 'Confirm email address', audience: 'Candidates', description: 'Sent when a candidate registers or asks for a new link.', placeholders: ['first_name'] },
  { id: 'welcome_candidate', label: 'Welcome (applicant)', audience: 'Candidates', description: 'Sent when an applicant opens an account. Points them to finish their profile and skills test.', placeholders: ['first_name'] },
  { id: 'welcome_employer', label: 'Welcome (employer)', audience: 'Employers', description: 'Sent when staff add an employer contact. Includes a link to set their password and open the talent pool.', placeholders: ['first_name', 'company'] },
  { id: 'password_reset', label: 'Password reset', audience: 'Candidates', description: 'Sent when anyone asks to reset a password from sign-in. Same branded layout for employers and staff.', placeholders: ['first_name'] },
  { id: 'reminder_profile', label: 'Reminder: unfinished profile', audience: 'Candidates', description: 'Sent by the reminder job to candidates who opened an account but did not finish their profile.', placeholders: ['first_name'] },
  { id: 'reminder_assessment', label: 'Reminder: assessment not taken', audience: 'Candidates', description: 'Sent by the reminder job to candidates with a finished profile who have not taken the assessment.', placeholders: ['first_name'] },
  { id: 'application_update', label: 'Application update', audience: 'Candidates', description: 'Sent when an application is received and on every stage change a recruiter marks as visible.', placeholders: ['first_name', 'job_title', 'reference', 'status_title', 'status_body', 'recruiter_note'] },
  { id: 'interview_booked', label: 'Interview booked', audience: 'Candidates', description: 'Sent when a recruiter books an interview and leaves "notify the candidate" on.', placeholders: ['first_name', 'job_title', 'reference', 'when', 'how', 'recruiter_note', 'join_link'] },
  { id: 'job_alerts', label: 'Weekly job alert', audience: 'Candidates', description: 'Weekly list of new jobs for the role a candidate chose. {{jobs}} is the list, one job per paragraph.', placeholders: ['first_name', 'role', 'count', 'jobs_heading', 'jobs'] },
  { id: 'newsletter_jobs', label: 'New jobs by email (footer)', audience: 'Leads', description: 'Weekly digest for people who left their email in the site footer. No role filter. {{jobs}} is the list, one job per paragraph.', placeholders: ['count', 'jobs_heading', 'jobs'] },
  { id: 'reminder_package', label: 'Reminder: the two reports', audience: 'Candidates', description: 'Sent to people who finished the free assessment and have not bought both reports. {{price}} is the bundle price.', placeholders: ['first_name', 'price'] },
  { id: 'payment_received', label: 'Report payment received', audience: 'Candidates', description: 'Receipt after a successful report payment. {{price}} is the amount paid.', placeholders: ['first_name', 'price'] },
  { id: 'legal_review_ready', label: 'Legal review delivered', audience: 'Candidates', description: 'Sent when staff deliver a package buyer’s preliminary legal review.', placeholders: ['first_name'] },
  { id: 'document_reupload', label: 'Document needs re-uploading', audience: 'Candidates', description: 'Sent when staff reject a visa document.', placeholders: ['first_name', 'document', 'reason'] },
  { id: 'lead_reply', label: 'Reply to a contact message', audience: 'Leads', description: 'Wraps a recruiter’s reply from the inbox. {{message}} is what the recruiter typed.', placeholders: ['first_name', 'message'] },
  { id: 'employer_shortlist', label: 'Candidates shortlisted', audience: 'Employers', description: 'Sent to an employer when candidates are put forward for their vacancies.', placeholders: ['count', 'headline', 'vacancies'] },
  { id: 'employer_unlock', label: 'Profile unlock decision', audience: 'Employers', description: 'Sent when staff approve or decline a request to see a candidate’s full name. {{decision}} is approved or declined.', placeholders: ['decision', 'headline', 'detail'] },
  { id: 'employer_job_live', label: 'Vacancy published', audience: 'Employers', description: 'Sent when a vacancy they requested (or own) goes live. {{job_title}} and {{city}} name the posting.', placeholders: ['job_title', 'city'] },
  { id: 'staff_alert', label: 'Staff alert', audience: 'Staff', description: 'New applications, payments and vacancy requests, sent to the staff alert addresses.', placeholders: ['subject', 'line', 'action_label'] },
];

export const DEFAULT_EMAILS: EmailSettings = {
  verification: {
    subject: 'Confirm your email address',
    heading: 'Confirm your email address',
    body: 'Hi {{first_name}},\n\nPlease confirm this is your address. Your assessment report is sent here, and your application cannot be completed without it.\n\nThis link works once. If it has expired you can ask for a new one from your dashboard.\n\nIf you did not start an application on {{site_name}}, ignore this message.',
    action: 'Confirm my email address',
  },
  welcome_candidate: {
    subject: 'Welcome to {{site_name}}',
    heading: 'Your account is ready',
    body: 'Hello {{first_name}},\n\nWelcome to {{site_name}}. Your account is open.\n\nNext: finish your profile so we can rewrite your CV, take the free skills test, and read your score. Applying is free. The skills report and the visa-requirements list are optional, and you only see those prices after your score.\n\nIf you have questions, reply to this email or write to {{support_email}}.',
    action: 'Go to my dashboard',
  },
  welcome_employer: {
    subject: 'Welcome to {{site_name}} · {{company}}',
    heading: 'Your employer account is ready',
    body: 'Hello {{first_name}},\n\n{{company}} is set up on {{site_name}}. Choose a password with the button below, then open your talent pool to search assessed candidates, request vacancies and review applicants we shortlist for you.\n\nThis link expires in about an hour. If it stops working, use Forgot password on the sign-in page.\n\nQuestions: {{support_email}}.',
    action: 'Set password and open the portal',
  },
  password_reset: {
    subject: 'Reset your {{site_name}} password',
    heading: 'Choose a new password',
    body: 'Hello {{first_name}},\n\nWe received a request to reset the password for this email on {{site_name}}. Use the button below to choose a new one. The link works once and expires in about an hour.\n\nIf you did not ask for this, ignore this message. Your password stays the same.',
    action: 'Choose a new password',
  },
  reminder_profile: {
    subject: '{{first_name}}, your {{site_name}} application is waiting',
    heading: 'Your application is waiting',
    body: 'Hello {{first_name}},\n\nYou opened an account with {{site_name}} and did not finish your application. Nothing is lost: sign in and carry on from where you stopped.',
    action: 'Continue my application',
  },
  reminder_assessment: {
    subject: '{{first_name}}, one step left on your {{site_name}} application',
    heading: 'One step left',
    body: 'Hello {{first_name}},\n\nYour profile is saved. The assessment is the only thing left, and you can take it on your phone.\n\nTaking the assessment is free and puts you in our candidate database.',
    action: 'Take the assessment',
  },
  application_update: {
    subject: '{{status_title}}: {{job_title}}',
    heading: '{{status_title}}',
    body: 'Hello {{first_name}},\n\n{{job_title}} ({{reference}}): {{status_body}}\n\n{{recruiter_note}}',
    action: 'Track my application',
  },
  interview_booked: {
    subject: 'Interview booked: {{job_title}}',
    heading: 'Your interview is booked',
    body: 'Hello {{first_name}},\n\nYour interview for {{job_title}} ({{reference}}) is booked.\n\nWhen: {{when}}\n\nHow: {{how}}\n\n{{recruiter_note}}\n\n{{join_link}}',
    action: 'See my interview',
  },
  job_alerts: {
    subject: '{{jobs_heading}}',
    heading: '{{jobs_heading}}',
    body: 'Hello {{first_name}},\n\nNew this week, for the role you chose. Applying is free.\n\n{{jobs}}',
    action: 'See all {{role}} jobs',
  },
  newsletter_jobs: {
    subject: '{{jobs_heading}}',
    heading: '{{jobs_heading}}',
    body: 'New jobs opened this week on {{site_name}}. Applying is free.\n\n{{jobs}}',
    action: 'See all jobs',
  },
  reminder_package: {
    subject: '{{first_name}}, the two reports are still available',
    heading: 'Your score is ready',
    body: 'Hello {{first_name}},\n\nYou finished the free assessment and you are in our candidate database. Your rewritten CV and your score stay free. If you want them, the skills report and the visa-requirements list together are {{price}}.\n\nBuying either does not change your shortlist chances and does not guarantee a job or a visa. You can buy from your dashboard whenever you like.',
    action: 'See the two prices',
  },
  payment_received: {
    subject: 'Payment received',
    heading: 'Thank you for your payment',
    body: 'Hello {{first_name}},\n\nWe received {{price}}. The document you bought is on your dashboard.\n\nKeep this email as your receipt. If anything looks wrong, reply to this message.',
    action: 'Open my dashboard',
  },
  legal_review_ready: {
    subject: 'Your preliminary legal review is ready',
    heading: 'Your legal review is ready',
    body: 'Hello {{first_name}},\n\nOur legal team has finished the preliminary review of the documents you sent. It sets out what a Portuguese work visa needs, what is still missing and anything that needs a closer look.\n\nIt is a preliminary review, not permission to work and not a decision on a visa: those are made only by the authorities.',
    action: 'Read it',
  },
  document_reupload: {
    subject: 'Please upload your {{document}} again',
    heading: 'A document needs a new upload',
    body: 'Hello {{first_name}},\n\nWe checked your {{document}} and need a new copy.\n\nWhy: {{reason}}',
    action: 'Upload again',
  },
  lead_reply: {
    subject: 'Your message to us',
    heading: 'About your message',
    body: 'Hello {{first_name}},\n\n{{message}}\n\nYou can reply to this email; it reaches the same team.',
    action: '',
  },
  employer_shortlist: {
    subject: '{{headline}}',
    heading: '{{headline}}',
    body: 'Our recruiters have put forward new candidates for your vacancies:\n\n{{vacancies}}\n\nTheir profiles are on your Applicants page. To arrange an interview, reply to your recruiter and quote the reference.',
    action: 'See applicants',
  },
  employer_unlock: {
    subject: '{{headline}}',
    heading: '{{headline}}',
    body: '{{detail}}\n\nSign in to see the applicants list. Full names stay masked until a request is approved.',
    action: 'Open applicants',
  },
  employer_job_live: {
    subject: 'Your vacancy is live: {{job_title}}',
    heading: 'Your vacancy is live',
    body: '{{job_title}} in {{city}} is now published on the candidate site. Applicants will appear on your Applicants page as they are shortlisted.',
    action: 'See applicants',
  },
  staff_alert: {
    subject: '{{subject}}',
    heading: '{{subject}}',
    body: '{{line}}',
    action: '{{action_label}}',
  },
};

/**
 * Fills `{{name}}` placeholders. Unknown names become empty, and paragraphs
 * left empty by that are dropped, so an optional note that is not there
 * leaves no gap.
 */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, name: string) => values[name] ?? '');
}

export function paragraphsOf(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
