import { redirect } from 'next/navigation';
import { getViewer, homeFor } from '@/lib/auth';
import { defaultLocale, localePath } from '@/lib/i18n';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { isApplicationStatus, type ApplicationStatus } from '@/lib/applications/status';
import type { JobStatus } from '@/lib/jobs/types';

/**
 * The employer portal: vacancy requests and shortlisted applicants.
 *
 * An employer never publishes anything. What they describe arrives as a draft
 * linked to their employer, and a recruiter turns it into a posting. They see
 * an applicant only once a recruiter has shortlisted them, so the screening
 * stage, and everyone screened out at it, stays with our team.
 */

export const EXPERIENCE_BANDS = ['Under 1 year', '1 to 3 years', '3 to 5 years', 'More than 5 years'];

/** What an employer reads for each job status: where their request stands. */
export const REQUEST_STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'With our team',
  published: 'Live',
  closed: 'Closed',
  archived: 'Archived',
};

export type EmployerPortal = {
  employerId: string | null;
  name: string;
  /** True only without Supabase: the pages show sample data and refuse writes. */
  demo: boolean;
};

/**
 * For the portal pages. Staff are sent to the console's own view of the same
 * thing rather than an employer screen with nothing in it; candidates to their
 * dashboard; anyone else to sign in.
 */
export async function requireEmployerPortal(returnTo: string, staffHome: string): Promise<EmployerPortal> {
  if (!isSupabaseConfigured()) return { employerId: null, name: 'Sample hotel group', demo: true };

  const viewer = await getViewer();
  if (viewer.role === 'employer') {
    return { employerId: viewer.employer.employerId, name: viewer.employer.name, demo: false };
  }
  if (viewer.role === 'staff') redirect(staffHome);
  if (viewer.role !== 'anonymous') redirect(homeFor(viewer, defaultLocale));
  redirect(localePath(defaultLocale, `/signin?next=${encodeURIComponent(returnTo)}`));
}

// ------------------------------------------------------------ vacancy requests

export type VacancyRequest = {
  id: string;
  title: string;
  city: string;
  openings: number;
  status: JobStatus;
  slug: string;
  requestedAt: string | null;
  publishedAt: string | null;
};

const SAMPLE_REQUESTS: VacancyRequest[] = [
  {
    id: 'sample-request-1',
    title: 'Housekeeping attendant',
    city: 'Albufeira',
    openings: 6,
    status: 'draft',
    slug: 'housekeeping-attendant-albufeira',
    requestedAt: '2026-10-13T09:12:00.000Z',
    publishedAt: null,
  },
  {
    id: 'sample-request-2',
    title: 'Line cook',
    city: 'Albufeira',
    openings: 3,
    status: 'published',
    slug: 'line-cook-algarve',
    requestedAt: '2026-09-22T10:40:00.000Z',
    publishedAt: '2026-09-25T08:00:00.000Z',
  },
];

/**
 * Every posting linked to the employer, requested or not. Read through the
 * session client, so RLS (`jobs_employer_read`) decides; the employer filter
 * is still needed because the public policy also returns everyone's live jobs.
 */
export async function listEmployerVacancies(portal: EmployerPortal): Promise<VacancyRequest[]> {
  if (portal.demo || !portal.employerId) return SAMPLE_REQUESTS;
  const supabase = await getServerSupabase();
  const { data, error } = (await supabase
    ?.from('job_postings')
    .select('id, title, city, openings, status, slug, requested_at, published_at, created_at')
    .eq('employer_id', portal.employerId)
    .order('created_at', { ascending: false })
    .limit(200)) ?? { data: null, error: null };
  if (error) console.error('[employer] vacancies failed', error);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    city: String(row.city),
    openings: Number(row.openings ?? 1),
    status: row.status as JobStatus,
    slug: String(row.slug),
    requestedAt: (row.requested_at as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
  }));
}

/** The request behind a posting, for the recruiter editing it. Console only. */
export async function getVacancyRequest(
  jobId: string,
): Promise<{ employerName: string; requestedAt: string; note: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const admin = getAdminSupabase();
  const { data } = (await admin
    ?.from('job_postings')
    .select('requested_at, request_note, employers (name)')
    .eq('id', jobId)
    .maybeSingle()) ?? { data: null };
  if (!data?.requested_at) return null;
  const employer = data.employers as { name?: string } | { name?: string }[] | null;
  const employerName = (Array.isArray(employer) ? employer[0]?.name : employer?.name) ?? 'Employer';
  return { employerName, requestedAt: String(data.requested_at), note: String(data.request_note ?? '') };
}

// ------------------------------------------------------------ applicants

export type EmployerApplicant = {
  applicationId: string;
  reference: string;
  status: ApplicationStatus;
  statusChangedAt: string;
  jobTitle: string;
  jobCity: string;
  candidateName: string;
  candidatePosition: string | null;
  candidateCity: string;
  experience: string;
  nextInterviewAt: string | null;
};

function sampleApplicants(): EmployerApplicant[] {
  const interview = new Date();
  interview.setUTCDate(interview.getUTCDate() + 3);
  interview.setUTCHours(9, 0, 0, 0);
  return [
    {
      applicationId: 'sample-0',
      reference: 'APP-7K3Q9D2F',
      status: 'interview',
      statusChangedAt: '2026-10-12T11:00:00.000Z',
      jobTitle: 'Line cook',
      jobCity: 'Albufeira',
      candidateName: 'Arjun Nair',
      candidatePosition: 'Line cook',
      candidateCity: 'Kochi, Kerala',
      experience: EXPERIENCE_BANDS[2] ?? '',
      nextInterviewAt: interview.toISOString(),
    },
    {
      applicationId: 'sample-1',
      reference: 'APP-2M8X4C1R',
      status: 'shortlisted',
      statusChangedAt: '2026-10-14T15:30:00.000Z',
      jobTitle: 'Line cook',
      jobCity: 'Albufeira',
      candidateName: 'Priya Sharma',
      candidatePosition: 'Commis chef',
      candidateCity: 'Dehradun, Uttarakhand',
      experience: EXPERIENCE_BANDS[1] ?? '',
      nextInterviewAt: null,
    },
  ];
}

/**
 * Shortlisted-or-later applicants to the employer's own postings, through
 * `employer_applicants()`, which fixes the columns: no contact details and no
 * assessment scores. Contact goes through the recruiter.
 */
export async function listEmployerApplicants(portal: EmployerPortal): Promise<EmployerApplicant[]> {
  if (portal.demo) return sampleApplicants();
  const supabase = await getServerSupabase();
  const { data, error } = (await supabase?.rpc('employer_applicants')) ?? { data: null, error: null };
  if (error) console.error('[employer] applicants failed', error);
  return ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const status = String(row.status);
    if (!isApplicationStatus(status)) return [];
    const band = Number(row.experience_band);
    return [
      {
        applicationId: String(row.application_id),
        reference: String(row.reference),
        status,
        statusChangedAt: String(row.status_changed_at),
        jobTitle: String(row.job_title),
        jobCity: String(row.job_city),
        candidateName: String(row.candidate_name),
        candidatePosition: (row.candidate_position as string | null) ?? null,
        candidateCity: String(row.candidate_city ?? ''),
        experience: EXPERIENCE_BANDS[band] ?? '-',
        nextInterviewAt: (row.next_interview_at as string | null) ?? null,
      },
    ];
  });
}
