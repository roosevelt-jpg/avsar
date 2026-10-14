import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { SAMPLE_JOBS } from '@/lib/jobs/sample';
import { jobFromRow, type Job } from '@/lib/jobs/types';
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
};

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

const SAMPLE_APPLICATIONS: CandidateApplication[] = (() => {
  const [cook, electrician] = SAMPLE_JOBS;
  if (!cook || !electrician) return [];
  return [
    {
      id: 'sample-app-1',
      reference: 'APP-7K3Q9D2F',
      status: 'interview',
      createdAt: '2026-10-02T10:00:00Z',
      statusChangedAt: '2026-10-11T10:00:00Z',
      coverNote: null,
      job: cook,
      events: [
        { id: 1, fromStatus: null, toStatus: 'submitted', note: 'Application received', visibleToCandidate: true, createdAt: '2026-10-02T10:00:00Z' },
        { id: 2, fromStatus: 'submitted', toStatus: 'screening', note: null, visibleToCandidate: true, createdAt: '2026-10-04T10:00:00Z' },
        { id: 3, fromStatus: 'screening', toStatus: 'shortlisted', note: 'Strong kitchen experience.', visibleToCandidate: true, createdAt: '2026-10-08T10:00:00Z' },
        { id: 4, fromStatus: 'shortlisted', toStatus: 'interview', note: 'Video interview on 16 October, 14:00 IST. Link sent by email.', visibleToCandidate: true, createdAt: '2026-10-11T10:00:00Z' },
      ],
    },
    {
      id: 'sample-app-2',
      reference: 'APP-2M8T4X1B',
      status: 'submitted',
      createdAt: '2026-10-12T10:00:00Z',
      statusChangedAt: '2026-10-12T10:00:00Z',
      coverNote: null,
      job: electrician,
      events: [
        { id: 5, fromStatus: null, toStatus: 'submitted', note: 'Application received', visibleToCandidate: true, createdAt: '2026-10-12T10:00:00Z' },
      ],
    },
  ];
})();

/**
 * The signed-in candidate's applications, newest first, with the events they
 * are allowed to see. Read through the session client, so RLS hides internal
 * notes even if this query forgot to.
 */
export async function listCandidateApplications(candidateId: string | null): Promise<CandidateApplication[]> {
  if (!isSupabaseConfigured() || !candidateId) return SAMPLE_APPLICATIONS;

  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('applications')
    .select(
      'id, reference, status, created_at, status_changed_at, cover_note, job_postings (id, slug, title, city, region, country, employer_display, hero_image_url, position_slug, status, closes_at), application_events (id, from_status, to_status, note, visible_to_candidate, created_at)',
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
  candidate: { id: string; fullName: string; email: string; phone: string; cityState: string | null; position: string | null; paymentStatus: string };
  job: { id: string; title: string; city: string; slug: string };
};

export type AdminApplicationFilters = { status?: string; jobId?: string; q?: string; page?: number };

const SAMPLE_ADMIN_ROWS: AdminApplicationRow[] = [
  ['Arjun Nair', 'Kochi, Kerala', 'chef', 'interview', 0],
  ['Priya Sharma', 'Jaipur, Rajasthan', 'cleaner', 'screening', 1],
  ['Mohammed Rafi', 'Kozhikode, Kerala', 'electrician', 'submitted', 2],
  ['Gurpreet Singh', 'Ludhiana, Punjab', 'driver', 'shortlisted', 3],
  ['Anjali Menon', 'Thrissur, Kerala', 'fb-service', 'offer', 4],
  ['Ravi Kumar', 'Chennai, Tamil Nadu', 'welder', 'submitted', 5],
].map(([name, city, position, status, jobIndex], index) => {
  const job = SAMPLE_JOBS[Number(jobIndex)] ?? SAMPLE_JOBS[0]!;
  return {
    id: `sample-${index}`,
    reference: `APP-SAMPLE${index}`,
    status: status as ApplicationStatus,
    createdAt: `2026-10-${String(10 - index).padStart(2, '0')}T09:00:00Z`,
    statusChangedAt: `2026-10-${String(12 - index).padStart(2, '0')}T09:00:00Z`,
    rating: index % 2 ? 4 : null,
    candidate: {
      id: `sample-candidate-${index}`,
      fullName: String(name),
      email: `${String(name).split(' ')[0]!.toLowerCase()}@example.com`,
      phone: '+91 98765 43210',
      cityState: String(city),
      position: String(position),
      paymentStatus: index % 2 ? 'paid' : 'pending',
    },
    job: { id: job.id, title: job.title, city: job.city, slug: job.slug },
  };
});

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
  'id, reference, status, created_at, status_changed_at, rating, candidates!inner (id, full_name, email, phone, city_state, position, payment_status), job_postings!inner (id, title, city, slug)';

export async function listApplicationsForConsole(
  filters: AdminApplicationFilters,
): Promise<{ rows: AdminApplicationRow[]; total: number; pageSize: number }> {
  const pageSize = 50;
  const page = Math.max(1, filters.page ?? 1);

  if (!isSupabaseConfigured()) {
    const rows = SAMPLE_ADMIN_ROWS.filter((row) => !filters.status || row.status === filters.status);
    return { rows, total: rows.length, pageSize };
  }

  const admin = getAdminSupabase();
  if (!admin) return { rows: [], total: 0, pageSize };

  let query = admin
    .from('applications')
    .select(ADMIN_SELECT, { count: 'exact' })
    .order('status_changed_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.status) query = query.eq('status', filters.status);
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
  candidateExtra: { yearsBand: number | null; hasPassport: boolean; createdAt: string | null; visible: boolean };
};

const DETAIL_SELECT =
  'id, reference, status, created_at, status_changed_at, rating, cover_note, answers, ' +
  'candidates!inner (id, full_name, email, phone, city_state, position, payment_status, years_experience_band, has_passport, created_at, visible_to_employers), ' +
  'job_postings!inner (id, title, city, slug, screening_questions), ' +
  'application_events (id, from_status, to_status, note, visible_to_candidate, actor, created_at)';

export async function getApplicationForConsole(id: string): Promise<AdminApplicationDetail | null> {
  if (!isSupabaseConfigured()) {
    const row = SAMPLE_ADMIN_ROWS.find((r) => r.id === id) ?? SAMPLE_ADMIN_ROWS[0];
    if (!row) return null;
    const job = SAMPLE_JOBS.find((j) => j.id === row.job.id);
    return {
      ...row,
      coverNote: 'I have six years of kitchen experience in Kerala and two in Dubai. I would like to grow as a chef in Europe.',
      answers: { haccp: 'yes', cuisine: 'South Indian, continental, buffet' },
      screeningQuestions: job?.screeningQuestions ?? [],
      events: SAMPLE_APPLICATIONS[0]?.events ?? [],
      candidateExtra: { yearsBand: 2, hasPassport: true, createdAt: '2026-10-01T09:00:00Z', visible: true },
    };
  }

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

  const raw = data as Record<string, unknown>;
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
    },
  };
}

/** Counts per status, for the console overview and the filter chips. */
export async function applicationCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) {
    return SAMPLE_ADMIN_ROWS.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});
  }
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
