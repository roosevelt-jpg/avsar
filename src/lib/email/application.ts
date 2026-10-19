import { localePath } from '@/lib/i18n';
import { getMailer } from './index';
import { composeEmail } from './compose';
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
    const url = `${input.origin}${localePath(input.locale, '/dashboard/applications')}`;
    const email = await composeEmail(
      'application_update',
      {
        first_name: input.name.split(' ')[0] || input.name,
        job_title: input.jobTitle,
        reference: input.reference,
        status_title: meta.candidateTitle,
        status_body: meta.candidateBody,
        recruiter_note: input.note ? `Message from your recruiter: ${input.note}` : '',
      },
      { origin: input.origin, actionUrl: url },
    );
    await getMailer().send({ to: input.to, ...email });
  } catch (error) {
    console.error('[email] application update failed', error);
  }
}
