import { createHash } from 'node:crypto';
import { getServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAnonSupabase } from '@/lib/supabase/anon';
import type { DocumentKind } from '@/lib/relocation/documents';
import type { Milestone, MilestoneStatus } from '@/lib/relocation/milestones';

/**
 * Reads for the relocation screens.
 *
 * The candidate's own view goes through the session client, so RLS limits it
 * to their rows. The console's views use the service role and are called only
 * from pages that have already checked `relocation.manage` or
 * `applications.view`. Without a database every read is empty.
 */

export type RelocationDocument = {
  id: string;
  kind: DocumentKind;
  fileName: string;
  status: 'uploaded' | 'verified' | 'rejected';
  expiresOn: string | null;
  rejectReason: string | null;
  createdAt: string;
};

export type FamilyLink = { id: string; label: string; createdAt: string; revokedAt: string | null; lastViewedAt: string | null; viewCount: number };

export type Story = { id: string; displayName: string; roleLabel: string; cityLabel: string | null; quote: string; status: 'submitted' | 'approved' | 'rejected' | 'withdrawn' };

export type CandidateRelocation = {
  documents: RelocationDocument[];
  plan: { applicationId: string; jobTitle: string; city: string; milestones: Milestone[] } | null;
  familyLinks: FamilyLink[];
  story: Story | null;
  /** Placed candidates may write a story. */
  placed: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const EMPTY_RELOCATION: CandidateRelocation = { documents: [], plan: null, familyLinks: [], story: null, placed: false };

function documentFrom(row: Record<string, unknown>): RelocationDocument {
  return {
    id: String(row.id),
    kind: row.kind as DocumentKind,
    fileName: String(row.file_name),
    status: row.status as RelocationDocument['status'],
    expiresOn: (row.expires_on as string | null) ?? null,
    rejectReason: (row.reject_reason as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export function milestoneFrom(row: Record<string, unknown>): Milestone {
  return {
    id: String(row.id),
    key: String(row.key),
    position: Number(row.position),
    status: row.status as MilestoneStatus,
    dueOn: (row.due_on as string | null) ?? null,
    blocker: (row.blocker as string | null) ?? null,
    doneAt: (row.done_at as string | null) ?? null,
  };
}

const DOC_COLUMNS = 'id, kind, file_name, status, expires_on, reject_reason, created_at';
const MILESTONE_COLUMNS = 'id, application_id, key, position, status, due_on, blocker, done_at';

export async function getCandidateRelocation(candidateId: string): Promise<CandidateRelocation> {
  const supabase = await getServerSupabase();
  if (!supabase) return EMPTY_RELOCATION;

  const [docs, milestones, links, stories, placed] = await Promise.all([
    supabase.from('relocation_documents').select(DOC_COLUMNS).eq('candidate_id', candidateId).is('superseded_at', null).order('created_at', { ascending: false }),
    supabase.from('relocation_milestones').select(MILESTONE_COLUMNS).eq('candidate_id', candidateId).order('position'),
    supabase.from('family_links').select('id, label, created_at, revoked_at, last_viewed_at, view_count').eq('candidate_id', candidateId).order('created_at', { ascending: false }),
    supabase.from('success_stories').select('id, display_name, role_label, city_label, quote, status').eq('candidate_id', candidateId).neq('status', 'withdrawn').order('created_at', { ascending: false }).limit(1),
    supabase.from('applications').select('id').eq('candidate_id', candidateId).in('status', ['hired', 'visa_processing', 'relocated']).limit(1),
  ]);

  const rows = (milestones.data ?? []) as Record<string, unknown>[];
  /* One plan per candidate in practice; if a second hire ever exists, show the latest. */
  const applicationId = rows.length ? String(rows[rows.length - 1]!.application_id) : null;
  let plan: CandidateRelocation['plan'] = null;
  if (applicationId) {
    const { data: app } = await supabase.from('applications').select('job_postings (title, city)').eq('id', applicationId).maybeSingle();
    const job = (Array.isArray(app?.job_postings) ? app.job_postings[0] : app?.job_postings) as { title?: string; city?: string } | undefined;
    plan = {
      applicationId,
      jobTitle: job?.title ?? 'Your job',
      city: job?.city ?? 'Portugal',
      milestones: rows.filter((r) => String(r.application_id) === applicationId).map(milestoneFrom),
    };
  }

  const story = (stories.data ?? [])[0] as Record<string, unknown> | undefined;
  return {
    documents: (docs.data ?? []).map((r) => documentFrom(r as Record<string, unknown>)),
    plan,
    familyLinks: (links.data ?? []).map((l) => ({
      id: String(l.id),
      label: String(l.label),
      createdAt: String(l.created_at),
      revokedAt: (l.revoked_at as string | null) ?? null,
      lastViewedAt: (l.last_viewed_at as string | null) ?? null,
      viewCount: Number(l.view_count ?? 0),
    })),
    story: story
      ? { id: String(story.id), displayName: String(story.display_name), roleLabel: String(story.role_label), cityLabel: (story.city_label as string | null) ?? null, quote: String(story.quote), status: story.status as Story['status'] }
      : null,
    placed: (placed.data ?? []).length > 0,
  };
}

/* ------------------------------------------------------------ console */

export type QueueDocument = RelocationDocument & { candidateId: string; candidateName: string };
export type OverdueMilestone = Milestone & { applicationId: string; candidateName: string; reference: string };
export type PendingStory = Story & { candidateName: string; createdAt: string };

export async function relocationQueue(): Promise<{ documents: QueueDocument[]; expiring: QueueDocument[]; overdue: OverdueMilestone[]; stories: PendingStory[] }> {
  const admin = getAdminSupabase();
  if (!admin) return { documents: [], expiring: [], overdue: [], stories: [] };

  const [docs, expiring, overdue, stories] = await Promise.all([
    admin.from('relocation_documents').select(`${DOC_COLUMNS}, candidate_id, candidates (full_name)`).eq('status', 'uploaded').is('superseded_at', null).order('created_at').limit(100),
    admin
      .from('relocation_documents')
      .select(`${DOC_COLUMNS}, candidate_id, candidates (full_name)`)
      .eq('status', 'verified')
      .is('superseded_at', null)
      .gte('expires_on', today())
      .lte('expires_on', plusDays(30))
      .order('expires_on')
      .limit(100),
    admin
      .from('relocation_milestones')
      .select(`${MILESTONE_COLUMNS}, candidates (full_name), applications (reference)`)
      .in('status', ['pending', 'in_progress', 'blocked'])
      .lt('due_on', today())
      .order('due_on')
      .limit(100),
    admin.from('success_stories').select('id, display_name, role_label, city_label, quote, status, created_at, candidates (full_name)').eq('status', 'submitted').order('created_at').limit(50),
  ]);

  const one = (value: unknown) => (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
  return {
    documents: ((docs.data ?? []) as Record<string, unknown>[]).map((r) => ({ ...documentFrom(r), candidateId: String(r.candidate_id), candidateName: String(one(r.candidates)?.full_name ?? '') })),
    expiring: ((expiring.data ?? []) as Record<string, unknown>[]).map((r) => ({ ...documentFrom(r), candidateId: String(r.candidate_id), candidateName: String(one(r.candidates)?.full_name ?? '') })),
    overdue: ((overdue.data ?? []) as Record<string, unknown>[]).map((r) => ({
      ...milestoneFrom(r),
      applicationId: String(r.application_id),
      candidateName: String(one(r.candidates)?.full_name ?? ''),
      reference: String(one(r.applications)?.reference ?? ''),
    })),
    stories: ((stories.data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      displayName: String(r.display_name),
      roleLabel: String(r.role_label),
      cityLabel: (r.city_label as string | null) ?? null,
      quote: String(r.quote),
      status: r.status as Story['status'],
      candidateName: String(one(r.candidates)?.full_name ?? ''),
      createdAt: String(r.created_at),
    })),
  };
}

/** For the application page: the plan and the candidate's file. */
export async function applicationRelocation(applicationId: string, candidateId: string): Promise<{ milestones: Milestone[]; documents: RelocationDocument[] }> {
  const admin = getAdminSupabase();
  if (!admin) return { milestones: [], documents: [] };
  const [m, d] = await Promise.all([
    admin.from('relocation_milestones').select(MILESTONE_COLUMNS).eq('application_id', applicationId).order('position'),
    admin.from('relocation_documents').select(DOC_COLUMNS).eq('candidate_id', candidateId).is('superseded_at', null).order('created_at', { ascending: false }),
  ]);
  return {
    milestones: (m.data ?? []).map((r) => milestoneFrom(r as Record<string, unknown>)),
    documents: (d.data ?? []).map((r) => documentFrom(r as Record<string, unknown>)),
  };
}

export type FamilyView = { firstName: string; jobTitle: string; city: string; milestones: Milestone[] };

/**
 * The family page's data. The token in the URL is the only credential, so the
 * lookup is by its hash through the service role, and what comes back is the
 * short list the candidate agreed to share: first name, job, city, steps.
 * A revoked or unknown token returns null, and the page says only that the
 * link does not work, never whether it ever existed.
 */
export async function familyView(token: string): Promise<FamilyView | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const admin = getAdminSupabase();
  if (!admin) return null;

  const { data: link } = await admin
    .from('family_links')
    .select('id, candidate_id, view_count, candidates (full_name, erased_at)')
    .eq('token_hash', createHash('sha256').update(token).digest('hex'))
    .is('revoked_at', null)
    .maybeSingle();
  if (!link) return null;
  const candidate = (Array.isArray(link.candidates) ? link.candidates[0] : link.candidates) as { full_name?: string; erased_at?: string | null } | undefined;
  if (!candidate || candidate.erased_at) return null;

  const { data: rows } = await admin.from('relocation_milestones').select(`${MILESTONE_COLUMNS}, applications (job_postings (title, city))`).eq('candidate_id', String(link.candidate_id)).order('position');
  const all = (rows ?? []) as Record<string, unknown>[];
  const applicationId = all.length ? String(all[all.length - 1]!.application_id) : null;
  const mine = all.filter((r) => String(r.application_id) === applicationId);
  const application = mine[0]?.applications as Record<string, unknown> | Record<string, unknown>[] | undefined;
  const postings = (Array.isArray(application) ? application[0] : application)?.job_postings as Record<string, unknown> | Record<string, unknown>[] | undefined;
  const job = Array.isArray(postings) ? postings[0] : postings;

  await admin
    .from('family_links')
    .update({ view_count: Number(link.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
    .eq('id', String(link.id));

  return {
    firstName: (candidate.full_name ?? '').trim().split(/\s+/)[0] || 'Your family member',
    jobTitle: String(job?.title ?? 'A job in Portugal'),
    city: String(job?.city ?? 'Portugal'),
    milestones: mine.map(milestoneFrom),
  };
}

/** Published stories for the public site, through the anon role's column grants. */
export async function publishedStories(limit = 6): Promise<Pick<Story, 'id' | 'displayName' | 'roleLabel' | 'cityLabel' | 'quote'>[]> {
  const anon = getAnonSupabase();
  if (!anon) return [];
  const { data } = await anon
    .from('success_stories')
    .select('id, display_name, role_label, city_label, quote')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({ id: String(r.id), displayName: String(r.display_name), roleLabel: String(r.role_label), cityLabel: (r.city_label as string | null) ?? null, quote: String(r.quote) }));
}
