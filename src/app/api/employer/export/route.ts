import { NextResponse } from 'next/server';
import { getSessionEmployer } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { STATUS_META } from '@/lib/applications/status';
import { toCsv } from '@/lib/csv';
import { listEmployerApplicants } from '@/lib/employer/portal';
import { scoreKinds } from '@/lib/relocation/documents';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

/**
 * The Applicants table as a spreadsheet, for an employer's own hiring
 * records. Exactly the columns the page shows, through the same
 * `employer_applicants()` read, so an export can never contain more than the
 * screen did: no contact details, and shortened names unless released.
 */
export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const employer = await getSessionEmployer();
  if (!employer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const applicants = await listEmployerApplicants();
  const csv = toCsv(
    ['Reference', 'Candidate', 'Role', 'From', 'Experience', 'English', 'Visa file', 'Fit score', 'Vacancy', 'City', 'Stage', 'Since', 'Next interview (UTC)'],
    applicants.map((a) => [
      a.reference,
      a.candidateName,
      a.candidatePosition,
      a.candidateCity,
      a.experience,
      a.english,
      scoreKinds(a.verifiedDocuments).ready ? 'Ready' : `${scoreKinds(a.verifiedDocuments).score}/100`,
      a.match.score,
      a.jobTitle,
      a.jobCity,
      STATUS_META[a.status].label,
      a.statusChangedAt.slice(0, 10),
      a.nextInterviewAt,
    ]),
  );
  await audit(employer.userId, 'employer.export', `employer:${employer.employerId}`, { rows: applicants.length });

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="applicants-${new Date().toISOString().slice(0, 10)}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
