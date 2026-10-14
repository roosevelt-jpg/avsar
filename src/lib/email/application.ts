import { getMailer } from './index';
import { renderEmail } from './template';
import { STATUS_META, type ApplicationStatus } from '@/lib/applications/status';

/**
 * Tells a candidate their application moved.
 *
 * Sent on submission and on every stage change a recruiter marks as visible.
 * Never throws: an email failure is logged, and the status change it reports
 * has already been saved.
 */
export async function sendApplicationUpdate(input: {
  to: string;
  name: string;
  jobTitle: string;
  reference: string;
  status: ApplicationStatus;
  note?: string | null;
  origin: string;
  locale: string;
}): Promise<void> {
  try {
    const meta = STATUS_META[input.status];
    const first = input.name.split(' ')[0] || input.name;
    const url = `${input.origin}/${input.locale}/dashboard/applications`;
    const paragraphs = [`Hello ${first},`, `${input.jobTitle} (${input.reference}): ${meta.candidateBody}`];
    if (input.note) paragraphs.push(`Message from your recruiter: ${input.note}`);

    await getMailer().send({
      to: input.to,
      subject: `${meta.candidateTitle}: ${input.jobTitle}`,
      text: `${paragraphs.join('\n\n')}\n\nTrack your application: ${url}`,
      html: renderEmail({
        preheader: meta.candidateTitle,
        heading: meta.candidateTitle,
        paragraphs,
        action: { label: 'Track my application', url },
        origin: input.origin,
      }),
    });
  } catch (error) {
    console.error('[email] application update failed', error);
  }
}
