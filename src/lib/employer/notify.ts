import { getMailer } from '@/lib/email';
import { composeEmail, type ComposedEmail } from '@/lib/email/compose';
import { getAdminSupabase } from '@/lib/supabase/admin';

type Row = {
  id: string;
  reference: string;
  job_postings: { title: string; city: string; employer_id: string | null } | { title: string; city: string; employer_id: string | null }[] | null;
};

/** Auth emails for every user linked to an employer, via the service role. */
async function employerEmails(employerId: string): Promise<string[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];
  const { data: contacts } = await admin.from('employer_users').select('auth_user_id').eq('employer_id', employerId);
  const emails: string[] = [];
  for (const contact of contacts ?? []) {
    const { data: user } = await admin.auth.admin.getUserById(String(contact.auth_user_id));
    if (user.user?.email) emails.push(user.user.email);
  }
  return emails;
}

async function sendToEmployer(
  employerId: string,
  build: () => Promise<ComposedEmail>,
): Promise<void> {
  const emails = await employerEmails(employerId);
  if (emails.length === 0) return;
  const mailer = getMailer();
  const email = await build();
  for (const to of emails) {
    await mailer.send({ to, ...email });
  }
}

/**
 * Tells an employer that candidates were put forward for their vacancies.
 *
 * One email per employer per move, however many applications it covered, so a
 * bulk shortlist of twenty is one message rather than twenty. The email names
 * the vacancy and the application references, not the candidates: names and
 * details are behind the employer's sign-in, and an inbox is not.
 *
 * Called with the applications that have just become visible to the employer.
 * Postings without an employer are skipped. Never throws: the move is saved.
 */
export async function notifyEmployersOfShortlist(applicationIds: string[], origin: string): Promise<void> {
  if (applicationIds.length === 0) return;
  try {
    const admin = getAdminSupabase();
    if (!admin) return;

    const { data, error } = await admin
      .from('applications')
      .select('id, reference, job_postings!inner (title, city, employer_id)')
      .in('id', applicationIds);
    if (error) {
      console.error('[employer-notify] read failed', error);
      return;
    }

    const byEmployer = new Map<string, string[]>();
    for (const row of (data ?? []) as unknown as Row[]) {
      const job = Array.isArray(row.job_postings) ? row.job_postings[0] : row.job_postings;
      if (!job?.employer_id) continue;
      const lines = byEmployer.get(job.employer_id) ?? [];
      lines.push(`${job.title}, ${job.city}: ${row.reference}`);
      byEmployer.set(job.employer_id, lines);
    }

    const url = `${origin}/admin/applicants`;
    for (const [employerId, lines] of byEmployer) {
      const count = lines.length;
      const headline = count === 1 ? 'A candidate has been shortlisted for you' : `${count} candidates have been shortlisted for you`;
      await sendToEmployer(employerId, () =>
        composeEmail(
          'employer_shortlist',
          { count: String(count), headline, vacancies: lines.join('\n\n') },
          { origin, actionUrl: url },
        ),
      );
    }
  } catch (error) {
    console.error('[employer-notify] shortlist failed', error);
  }
}

/** Approve or decline of a profile-unlock request. Never throws. */
export async function notifyEmployerOfUnlock(input: {
  employerId: string;
  decision: 'approved' | 'declined';
  origin: string;
}): Promise<void> {
  try {
    const headline =
      input.decision === 'approved'
        ? 'Profile unlock approved'
        : 'Profile unlock declined';
    const detail =
      input.decision === 'approved'
        ? 'Your request to see a candidate’s full name was approved. Open Applicants to continue.'
        : 'Your request to see a candidate’s full name was declined. The profile stays masked.';
    await sendToEmployer(input.employerId, () =>
      composeEmail(
        'employer_unlock',
        { decision: input.decision, headline, detail },
        { origin: input.origin, actionUrl: `${input.origin}/admin/applicants` },
      ),
    );
  } catch (error) {
    console.error('[employer-notify] unlock failed', error);
  }
}

/** Vacancy they own or requested is now published. Never throws. */
export async function notifyEmployerJobLive(input: {
  employerId: string;
  jobTitle: string;
  city: string;
  origin: string;
}): Promise<void> {
  try {
    await sendToEmployer(input.employerId, () =>
      composeEmail(
        'employer_job_live',
        { job_title: input.jobTitle, city: input.city },
        { origin: input.origin, actionUrl: `${input.origin}/admin/applicants` },
      ),
    );
  } catch (error) {
    console.error('[employer-notify] job live failed', error);
  }
}
