import { redirect } from 'next/navigation';
import { getViewer, homeFor } from '@/lib/auth';
import { defaultLocale, localePath } from '@/lib/i18n';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { isApplicationStatus, type ApplicationStatus } from '@/lib/applications/status';
import type { JobStatus } from '@/lib/jobs/types';
import type { Cefr } from '@/lib/data/candidates';
import { asCefr, sectorOf, yearsFromBand } from '@/lib/hiring/data';
import { matchScore, type MatchResult } from '@/lib/hiring/match';
import { benchReady, scoreKinds } from '@/lib/relocation/documents';

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
  /** False until we approve the employer's request to see the full name. */
  identityReleased: boolean;
  unlockPending: boolean;
  english: Cefr | null;
  overallScore: number | null;
  verifiedDocuments: string[];
  match: MatchResult;
};

function sampleApplicants(): EmployerApplicant[] {
  const interview = new Date();
  interview.setUTCDate(interview.getUTCDate() + 3);
  interview.setUTCHours(9, 0, 0, 0);
  const job = { position: 'chef', sector: 'food-beverage', minEnglish: 'A2' as const, minYears: 2 };
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
      identityReleased: true,
      unlockPending: false,
      english: 'B1',
      overallScore: 74,
      verifiedDocuments: ['passport', 'police_clearance'],
      match: matchScore(job, { position: 'chef', sector: 'food-beverage', english: 'B1', yearsExperience: 4, overallScore: 74, verifiedDocuments: ['passport', 'police_clearance'] }),
    },
    {
      applicationId: 'sample-1',
      reference: 'APP-2M8X4C1R',
      status: 'shortlisted',
      statusChangedAt: '2026-10-14T15:30:00.000Z',
      jobTitle: 'Line cook',
      jobCity: 'Albufeira',
      candidateName: 'Priya S.',
      candidatePosition: 'Commis chef',
      candidateCity: 'Dehradun, Uttarakhand',
      experience: EXPERIENCE_BANDS[1] ?? '',
      nextInterviewAt: null,
      identityReleased: false,
      unlockPending: false,
      english: 'A2',
      overallScore: 61,
      verifiedDocuments: [],
      match: matchScore(job, { position: 'chef', sector: 'food-beverage', english: 'A2', yearsExperience: 2, overallScore: 61, verifiedDocuments: [] }),
    },
  ];
}

/**
 * Shortlisted-or-later applicants to the employer's own postings, through
 * `employer_applicants()`, which fixes the columns: no contact details, and
 * a shortened name until we approve a request to release it. Contact goes
 * through the recruiter. The match score is worked out here against the
 * job's own requirements, which the employer can already read.
 */
export async function listEmployerApplicants(portal: EmployerPortal): Promise<EmployerApplicant[]> {
  if (portal.demo) return sampleApplicants();
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('employer_applicants');
  if (error) console.error('[employer] applicants failed', error);
  const rows = (data ?? []) as Record<string, unknown>[];

  const jobIds = [...new Set(rows.map((r) => String(r.job_id)))];
  const [jobs, unlocks] = await Promise.all([
    jobIds.length
      ? supabase.from('job_postings').select('id, position_slug, area, min_english, min_experience_years').in('id', jobIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    supabase.from('profile_unlock_requests').select('application_id').eq('status', 'pending'),
  ]);
  const jobById = new Map(((jobs.data ?? []) as Record<string, unknown>[]).map((j) => [String(j.id), j]));
  const pending = new Set((unlocks.data ?? []).map((u) => String(u.application_id)));

  return rows.flatMap((row) => {
    const status = String(row.status);
    if (!isApplicationStatus(status)) return [];
    const band = Number(row.experience_band);
    const job = jobById.get(String(row.job_id)) ?? {};
    const position = (row.candidate_position as string | null) ?? null;
    const english = asCefr(row.english_cefr);
    const overallScore = row.overall_score == null ? null : Number(row.overall_score);
    const verifiedDocuments = Array.isArray(row.verified_documents) ? row.verified_documents.map(String) : [];
    return [
      {
        applicationId: String(row.application_id),
        reference: String(row.reference),
        status,
        statusChangedAt: String(row.status_changed_at),
        jobTitle: String(row.job_title),
        jobCity: String(row.job_city),
        candidateName: String(row.candidate_name),
        candidatePosition: position,
        candidateCity: String(row.candidate_city ?? ''),
        experience: EXPERIENCE_BANDS[band] ?? '-',
        nextInterviewAt: (row.next_interview_at as string | null) ?? null,
        identityReleased: row.identity_released === true,
        unlockPending: pending.has(String(row.application_id)),
        english,
        overallScore,
        verifiedDocuments,
        match: matchScore(
          {
            position: (job.position_slug as string | null) ?? null,
            sector: (job.area as string | null) ?? null,
            minEnglish: asCefr(job.min_english),
            minYears: job.min_experience_years == null ? null : Number(job.min_experience_years),
          },
          { position, sector: sectorOf(position), english, yearsExperience: yearsFromBand(band), overallScore, verifiedDocuments },
        ),
      },
    ];
  });
}

// ------------------------------------------------------------ bench

export type BenchCandidate = {
  candidateId: string;
  name: string;
  position: string | null;
  city: string;
  english: Cefr | null;
  overallScore: number | null;
  yearsExperience: number | null;
  verifiedDocuments: string[];
  heldUntil: string | null;
  heldByMe: boolean;
};

/**
 * Assessed candidates whose passport and police clearance we have verified,
 * not yet placed, through `employer_bench()`: shortened names, no contact
 * details. The SQL narrows to a verified passport; the full rule lives in
 * `benchReady` so the app and the readiness score agree.
 */
export async function listBench(portal: EmployerPortal): Promise<BenchCandidate[]> {
  if (portal.demo) {
    return [
      { candidateId: 'sample-bench-1', name: 'Rahul K.', position: 'chef', city: 'Kochi, Kerala', english: 'B1', overallScore: 78, yearsExperience: 4, verifiedDocuments: ['passport', 'police_clearance', 'photo'], heldUntil: null, heldByMe: false },
      { candidateId: 'sample-bench-2', name: 'Sunita D.', position: 'cleaner', city: 'Pune, Maharashtra', english: 'A2', overallScore: 69, yearsExperience: 2, verifiedDocuments: ['passport', 'police_clearance'], heldUntil: new Date(Date.now() + 40 * 3_600_000).toISOString(), heldByMe: true },
    ];
  }
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('employer_bench');
  if (error) console.error('[employer] bench failed', error);
  return ((data ?? []) as Record<string, unknown>[])
    .map((row) => ({
      candidateId: String(row.candidate_id),
      name: String(row.candidate_name),
      position: (row.candidate_position as string | null) ?? null,
      city: String(row.candidate_city ?? ''),
      english: asCefr(row.english_cefr),
      overallScore: row.overall_score == null ? null : Number(row.overall_score),
      yearsExperience: row.years_experience == null ? null : Number(row.years_experience),
      verifiedDocuments: Array.isArray(row.verified_documents) ? row.verified_documents.map(String) : [],
      heldUntil: (row.held_until as string | null) ?? null,
      heldByMe: row.held_by_me === true,
    }))
    .filter((c) => benchReady(c.verifiedDocuments));
}

/** Counts for the top of the Applicants page, from the rows already loaded. */
export function applicantMetrics(applicants: EmployerApplicant[]): { shortlisted: number; interviewing: number; offers: number; hired: number; travelReady: number } {
  return {
    shortlisted: applicants.filter((a) => a.status === 'shortlisted').length,
    interviewing: applicants.filter((a) => a.status === 'interview').length,
    offers: applicants.filter((a) => a.status === 'offer').length,
    hired: applicants.filter((a) => ['hired', 'visa_processing', 'relocated'].includes(a.status)).length,
    travelReady: applicants.filter((a) => scoreKinds(a.verifiedDocuments).ready).length,
  };
}
