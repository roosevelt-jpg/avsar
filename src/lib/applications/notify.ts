import { sendApplicationUpdate } from '@/lib/email/application';
import { sendWhatsApp } from '@/lib/whatsapp';
import { STATUS_META, type ApplicationStatus } from './status';

/**
 * Tells a candidate their application moved: by email always, and by WhatsApp
 * if they opted in. Shared by the single move and the bulk move so the two can
 * never drift apart. Never throws.
 */
export async function notifyStageChange(input: {
  applicationId: string;
  candidateId: string;
  email: string;
  name: string;
  locale: string;
  jobTitle: string;
  reference: string;
  status: ApplicationStatus;
  note?: string | null;
  origin: string;
}): Promise<void> {
  await sendApplicationUpdate({
    to: input.email,
    name: input.name,
    jobTitle: input.jobTitle,
    reference: input.reference,
    status: input.status,
    note: input.note,
    origin: input.origin,
    locale: input.locale,
  });
  await sendWhatsApp({
    candidateId: input.candidateId,
    applicationId: input.applicationId,
    template: 'application_update',
    params: [input.name.split(' ')[0] || input.name, input.jobTitle, STATUS_META[input.status].candidateTitle],
  });
}
