import { getMailer } from '@/lib/email';
import { renderEmail } from '@/lib/email/template';
import { getAdminSupabase } from '@/lib/supabase/admin';

type Row = {
  id: string;
  reference: string;
  job_postings: { title: string; city: string; employer_id: string | null } | { title: string; city: string; employer_id: string | null }[] | null;
};

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
      const { data: contacts } = await admin.from('employer_users').select('auth_user_id').eq('employer_id', employerId);
      const emails: string[] = [];
      for (const contact of contacts ?? []) {
        const { data: user } = await admin.auth.admin.getUserById(String(contact.auth_user_id));
        if (user.user?.email) emails.push(user.user.email);
      }
      if (emails.length === 0) continue;

      const count = lines.length;
      const heading = count === 1 ? 'A candidate has been shortlisted for you' : `${count} candidates have been shortlisted for you`;
      const paragraphs = [
        'Our recruiters have put forward new candidates for your vacancies:',
        ...lines,
        'Their profiles are on your Applicants page. To arrange an interview, reply to your recruiter and quote the reference.',
      ];

      for (const to of emails) {
        await getMailer().send({
          to,
          subject: heading,
          text: `${paragraphs.join('\n\n')}\n\nSee your applicants: ${url}`,
          html: renderEmail({ preheader: heading, heading, paragraphs, action: { label: 'See applicants', url }, origin }),
        });
      }
    }
  } catch (error) {
    console.error('[employer-notify] failed', error);
  }
}
