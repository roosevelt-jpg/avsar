import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { jobFromRow, type Job } from '@/lib/jobs/types';
import { INTERVIEW_COLUMNS, interviewFromRow, type Interview } from '@/lib/interviews/time';
import type { ApplicationStatus } from './status';

export type ApplicationEvent = {
  id: number;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus | null;
  note: string | null;
  visibleToCandidate: boolean;
  actorEmail?: string | null;
  createdAt: string;
};

export type CandidateApplication = {
  id: string;
  reference: string;
  status: ApplicationStatus;
  createdAt: string;
  statusChangedAt: string;
  coverNote: string | null;
  job: Pick<Job, 'id' | 'slug' | 'title' | 'city' | 'region' | 'country' | 'employerDisplay' | 'heroImageUrl' | 'positionSlug' | 'status' | 'closesAt'>;
  events: ApplicationEvent[];
  /** Scheduled interviews still to come, soonest first. */
  interviews: Interview[];
};

function upcoming(raw: unknown): Interview[] {
  const now = Date.now() - 2 * 3_600_000;
  return (Array.isArray(raw) ? raw : [])
    .map((row) => interviewFromRow(row as Record<string, unknown>))
    .filter((interview) => interview.status === 'scheduled' && new Date(interview.startsAt).getTime() > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function eventFromRow(row: Record<string, unknown>): ApplicationEvent {
  return {
    id: Number(row.id),
    fromStatus: (row.from_status as ApplicationStatus | null) ?? null,
    toStatus: (row.to_status as ApplicationStatus | null) ?? null,
    note: (row.note as string | null) ?? null,
    visibleToCandidate: row.visible_to_candidate !== false,
    createdAt: String(row.created_at),
  };
}

/**
 * The signed-in candidate's applications, newest first, with the events they
 * are allowed to see. Read through the session client, so RLS hides internal
 * notes even if this query forgot to.
 */
export async function listCandidateApplications(candidateId: string | null): Promise<CandidateApplication[]> {
  if (!candidateId) return [];
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('applications')
    .select(
      `id, reference, status, created_at, status_changed_at, cover_note, job_postings (id, slug, title, city, region, country, employer_display, hero_image_url, position_slug, status, closes_at), application_events (id, from_status, to_status, note, visible_to_candidate, created_at), application_interviews (${INTERVIEW_COLUMNS})`,
    )
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[applications] candidate list failed', error);
    return [];
  }

  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const jobRaw = Array.isArray(row.job_postings) ? row.job_postings[0] : row.job_postings;
    const job = jobFromRow((jobRaw ?? {}) as Record<string, unknown>);
    const events = (Array.isArray(row.application_events) ? row.application_events : [])
      .map((event) => eventFromRow(event as Record<string, unknown>))
      .filter((event) => event.visibleToCandidate)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return {
      id: String(row.id),
      reference: String(row.reference),
      status: row.status as ApplicationStatus,
      createdAt: String(row.created_at),
      statusChangedAt: String(row.status_changed_at),
      coverNote: (row.cover_note as string | null) ?? null,
      job,
      events,
      interviews: upcoming(row.application_interviews),
    };
  });
}

// ------------------------------------------------------------------ console

export type AdminApplicationRow = {
  id: string;
  reference: string;
  status: ApplicationStatus;
  createdAt: string;
  statusChangedAt: string;
  rating: number | null;
  assignedTo: string | null;
  nextStep: string | null;
  nextStepOn: string | null;
  candidate: { id: string; fullName: string; email: string; phone: string; cityState: string | null; position: string | null; paymentStatus: string };
  job: { id: string; title: string; city: string; slug: string };
};

export type AdminApplicationFilters = {
  status?: string;
  jobId?: string;
  q?: string;
  page?: number;
  /** Only applications this staff member has taken. */
  assignedTo?: string;
  /** Submitted applications created before this instant are past the reply promise. */
  lateBefore?: string;
};

function adminRowFrom(raw: Record<string, unknown>): AdminApplicationRow {
  const one = (value: unknown) => (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
  const c = one(raw.candidates) ?? {};
  const j = one(raw.job_postings) ?? {};
  return {
    id: String(raw.id),
    reference: String(raw.reference),
    status: raw.status as ApplicationStatus,
    createdAt: String(raw.created_at),
    statusChangedAt: String(raw.status_changed_at),
    rating: (raw.rating as number | null) ?? null,
    assignedTo: (raw.assigned_to as string | null) ?? null,
    nextStep: (raw.next_step as string | null) ?? null,
    nextStepOn: (raw.next_step_on as string | null) ?? null,
    candidate: {
      id: String(c.id ?? ''),
      fullName: String(c.full_name ?? ''),
      email: String(c.email ?? ''),
      phone: String(c.phone ?? ''),
      cityState: (c.city_state as string | null) ?? null,
      position: (c.position as string | null) ?? null,
      paymentStatus: String(c.payment_status ?? 'pending'),
    },
    job: { id: String(j.id ?? ''), title: String(j.title ?? ''), city: String(j.city ?? ''), slug: String(j.slug ?? '') },
  };
}

const ADMIN_SELECT =
  'id, reference, status, created_at, status_changed_at, rating, assigned_to, next_step, next_step_on, candidates!inner (id, full_name, email, phone, city_state, position, payment_status), job_postings!inner (id, title, city, slug)';

export async function listApplicationsForConsole(
  filters: AdminApplicationFilters,
): Promise<{ rows: AdminApplicationRow[]; total: number; pageSize: number }> {
  const pageSize = 50;
  const page = Math.max(1, filters.page ?? 1);

  const admin = getAdminSupabase();
  if (!admin) return { rows: [], total: 0, pageSize };

  /* The review queue is oldest first. A new application at the top is how a
     late reply gets buried under today's arrivals. */
  const oldest = Boolean(filters.lateBefore) || filters.status === 'submitted';
  let query = admin
    .from('applications')
    .select(ADMIN_SELECT, { count: 'exact' })
    .order(oldest ? 'created_at' : 'status_changed_at', { ascending: oldest })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.lateBefore) query = query.eq('status', 'submitted').lt('created_at', filters.lateBefore);
  else if (filters.status) query = query.eq('status', filters.status);
  if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
  if (filters.jobId) query = query.eq('job_id', filters.jobId);
  if (filters.q?.trim()) {
    const q = filters.q.trim().replace(/[%,()]/g, ' ');
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`, { referencedTable: 'candidates' });
  }

  const { data, count, error } = await query;
  if (error) {
    console.error('[applications] console list failed', error);
    return { rows: [], total: 0, pageSize };
  }
  return { rows: (data ?? []).map((row) => adminRowFrom(row as Record<string, unknown>)), total: count ?? 0, pageSize };
}

export type AdminApplicationDetail = AdminApplicationRow & {
  coverNote: string | null;
  answers: Record<string, unknown>;
  screeningQuestions: Job['screeningQuestions'];
  events: ApplicationEvent[];
  candidateExtra: { yearsBand: number | null; hasPassport: boolean; createdAt: string | null; visible: boolean; whatsappOptIn: boolean };
  /** The CV attached when applying, if any. Downloaded through a staff-only signed URL. */
  cvDocumentId: string | null;
  /** Every interview, newest first, including cancelled and past ones. */
  interviews: Interview[];
};

const DETAIL_SELECT =
  'id, reference, status, created_at, status_changed_at, rating, assigned_to, next_step, next_step_on, cover_note, answers, cv_document_id, ' +
  'candidates!inner (id, full_name, email, phone, city_state, position, payment_status, years_experience_band, has_passport, created_at, visible_to_employers, whatsapp_opt_in_at), ' +
  'job_postings!inner (id, title, city, slug, screening_questions), ' +
  'application_events (id, from_status, to_status, note, visible_to_candidate, actor, created_at), ' +
  `application_interviews (${INTERVIEW_COLUMNS})`;

export async function getApplicationForConsole(id: string): Promise<AdminApplicationDetail | null> {
  const admin = getAdminSupabase();
  if (!admin) return null;

  const { data, error } = await admin
    .from('applications')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('[applications] console get failed', error);
    return null;
  }

  // The joined select is too complex for the generated client types, so Supabase
  // types this row as an error string. At runtime it is the application object.
  const raw = data as unknown as Record<string, unknown>;
  const base = adminRowFrom(raw);
  const c = (Array.isArray(raw.candidates) ? raw.candidates[0] : raw.candidates) as Record<string, unknown>;
  const j = (Array.isArray(raw.job_postings) ? raw.job_postings[0] : raw.job_postings) as Record<string, unknown>;
  const events = (Array.isArray(raw.application_events) ? raw.application_events : [])
    .map((event) => eventFromRow(event as Record<string, unknown>))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    ...base,
    coverNote: (raw.cover_note as string | null) ?? null,
    answers: (raw.answers as Record<string, unknown>) ?? {},
    screeningQuestions: Array.isArray(j?.screening_questions) ? (j.screening_questions as Job['screeningQuestions']) : [],
    events,
    candidateExtra: {
      yearsBand: (c?.years_experience_band as number | null) ?? null,
      hasPassport: Boolean(c?.has_passport),
      createdAt: (c?.created_at as string | null) ?? null,
      visible: c?.visible_to_employers !== false,
      whatsappOptIn: Boolean(c?.whatsapp_opt_in_at),
    },
    cvDocumentId: (raw.cv_document_id as string | null) ?? null,
    interviews: (Array.isArray(raw.application_interviews) ? raw.application_interviews : [])
      .map((row) => interviewFromRow(row as Record<string, unknown>))
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
  };
}

export type UpcomingInterview = Interview & { candidateName: string; jobTitle: string };

/**
 * The next scheduled interviews across all applications, for the console
 * dashboard. Service role: callers check applications.view first.
 */
export async function listUpcomingInterviews(limit = 6): Promise<UpcomingInterview[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];
  const { data, error } = await admin
    .from('application_interviews')
    .select(`${INTERVIEW_COLUMNS}, applications!inner (candidates!inner (full_name), job_postings!inner (title))`)
    .eq('status', 'scheduled')
    .gte('starts_at', new Date(Date.now() - 3_600_000).toISOString())
    .order('starts_at', { ascending: true })
    .limit(limit);
  if (error) {
    console.error('[interviews] upcoming failed', error);
    return [];
  }
  const one = (value: unknown) => (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const app = one(row.applications) ?? {};
    return {
      ...interviewFromRow(row),
      candidateName: String(one(app.candidates)?.full_name ?? ''),
      jobTitle: String(one(app.job_postings)?.title ?? ''),
    };
  });
}

/** Counts per status, for the console overview and the filter chips. */
export async function applicationCounts(): Promise<Record<string, number>> {
  const admin = getAdminSupabase();
  if (!admin) return {};
  const statuses = ['submitted', 'screening', 'shortlisted', 'interview', 'offer', 'hired', 'visa_processing', 'relocated', 'rejected', 'withdrawn'];
  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await admin.from('applications').select('id', { count: 'exact', head: true }).eq('status', status);
      return [status, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(results);
}
