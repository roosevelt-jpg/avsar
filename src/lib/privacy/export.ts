import type { getAdminSupabase } from '@/lib/supabase/admin';
import { BACKGROUND_COLUMNS } from '@/lib/candidate/background';

type Admin = NonNullable<ReturnType<typeof getAdminSupabase>>;

/**
 * Everything we hold about one candidate, as one JSON document.
 *
 * Built for the right of access (GDPR article 15, DPDP section 11): what the
 * candidate gave us, what we worked out about them, and what we did with it.
 * Left out on purpose: salted hashes (they identify nobody to the reader and
 * would only help someone match them elsewhere), storage paths, internal staff
 * notes, and the protected attributes the CV pass separates out and never uses.
 * Files themselves are listed, not embedded; the candidate already has them
 * and the dashboard links to what can be downloaded.
 */

const OMIT = new Set(['phone_hash', 'passport_hash', 'auth_user_id', 'storage_path', 'document_hash', 'fingerprint', 'pdf_path', 'referral_agent_id']);

function clean(rows: unknown): Record<string, unknown>[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => Object.fromEntries(Object.entries(row as Record<string, unknown>).filter(([key]) => !OMIT.has(key))));
}

export async function collectCandidateData(admin: Admin, candidateId: string): Promise<Record<string, unknown> | null> {
  const { data: candidate } = await admin.from('candidates').select('*').eq('id', candidateId).maybeSingle();
  if (!candidate) return null;

  const byCandidate = (table: string, columns = '*') => admin.from(table).select(columns).eq('candidate_id', candidateId);

  const [profile, experiences, education, applications, saved, payments, report, attempts, cvs, cvAssessments, voice, pack, consents, messages, leads, documents, milestones, familyLinks, stories, legalReview, background] =
    await Promise.all([
      byCandidate('candidate_profiles'),
      byCandidate('candidate_experiences'),
      byCandidate('candidate_education'),
      byCandidate('applications', 'id, reference, status, cover_note, answers, source, created_at, status_changed_at, job_postings (title, city)'),
      byCandidate('saved_jobs', 'created_at, job_postings (title, city)'),
      byCandidate('payments', 'provider, amount_paise, net_paise, gst_paise, status, receipt_no, paid_at, refunded_at, created_at'),
      byCandidate('reports'),
      byCandidate('assessment_attempts', 'section, started_at, submitted_at, status'),
      byCandidate('cv_documents', 'id, mime_type, byte_size, state, uploaded_at'),
      byCandidate('cv_assessments', 'sector, suggested_score, role_fit, criteria, strengths, concerns, profile, discrepancies, requires_review, model, created_at'),
      byCandidate('candidate_voice_intros'),
      byCandidate('career_packs'),
      byCandidate('consent_events', 'consent, granted, version, source, created_at'),
      byCandidate('notification_log', 'channel, template, status, created_at'),
      byCandidate('leads', 'topic, status, message, created_at'),
      byCandidate('relocation_documents', 'kind, file_name, status, expires_on, reject_reason, created_at, superseded_at'),
      byCandidate('relocation_milestones', 'key, status, due_on, blocker, done_at'),
      byCandidate('family_links', 'label, created_at, revoked_at, last_viewed_at, view_count'),
      byCandidate('success_stories', 'display_name, role_label, city_label, quote, status, published_at, created_at'),
      byCandidate('legal_reviews', 'status, summary, requirements, missing_documents, issues, delivered_at'),
      byCandidate('candidate_backgrounds', BACKGROUND_COLUMNS),
    ]);

  const applicationIds = ((applications.data ?? []) as unknown as { id: string }[]).map((a) => String(a.id));
  const [events, interviews] = applicationIds.length
    ? await Promise.all([
        /* Only what the candidate's own tracker shows. Internal notes are
           staff working papers about the decision, not data the person gave. */
        admin
          .from('application_events')
          .select('application_id, from_status, to_status, note, created_at')
          .in('application_id', applicationIds)
          .eq('visible_to_candidate', true),
        admin
          .from('application_interviews')
          .select('application_id, starts_at, duration_minutes, timezone, mode, location, candidate_message, status')
          .in('application_id', applicationIds),
      ])
    : [{ data: [] }, { data: [] }];

  return {
    exportedAt: new Date().toISOString(),
    about:
      'Everything this platform holds about you. Hashes used to detect duplicate accounts, internal staff notes and file storage locations are not included. Payments are kept for as long as tax law requires, even after an erasure.',
    account: clean([candidate])[0],
    profile: clean(profile.data),
    experience: clean(experiences.data),
    education: clean(education.data),
    applications: clean(applications.data),
    applicationHistory: clean(events.data),
    interviews: clean(interviews.data),
    savedJobs: clean(saved.data),
    payments: clean(payments.data),
    assessmentReport: clean(report.data),
    assessmentAttempts: clean(attempts.data),
    cvFiles: clean(cvs.data),
    cvAssessments: clean(cvAssessments.data),
    voiceIntroduction: clean(voice.data),
    careerPack: clean(pack.data),
    consents: clean(consents.data),
    messagesSent: clean(messages.data),
    messagesToUs: clean(leads.data),
    visaDocuments: clean(documents.data),
    relocationPlan: clean(milestones.data),
    familyLinks: clean(familyLinks.data),
    stories: clean(stories.data),
    legalReview: clean(legalReview.data),
    background: clean(background.data),
  };
}
