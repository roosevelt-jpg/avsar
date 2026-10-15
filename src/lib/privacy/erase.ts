import type { getAdminSupabase } from '@/lib/supabase/admin';
import { log } from '@/lib/observability/log';

type Admin = NonNullable<ReturnType<typeof getAdminSupabase>>;

/**
 * Stages at which erasing would break a legal process already under way for
 * this person: an offer being accepted, a contract, a visa file. The candidate
 * is told why and the request stays open until the stage moves on.
 */
export const ERASE_BLOCKING_STATUSES = ['offer', 'hired', 'visa_processing'] as const;

export type EraseResult = { status: 'erased' } | { status: 'blocked'; reason: 'active_process'; references: string[] } | { status: 'not_found' };

async function removeFolder(admin: Admin, bucket: string, folder: string) {
  const { data } = await admin.storage.from(bucket).list(folder, { limit: 1000 });
  const paths = (data ?? []).map((file) => `${folder}/${file.name}`);
  if (paths.length > 0) {
    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) log.warn('privacy.erase_storage_failed', { bucket, error: error.message });
  }
}

/**
 * Erase a candidate's personal data, keeping the skeleton the business must keep.
 *
 * What goes: name, contact details, profile, experience, CVs and voice files,
 * assessments of the CV, the report, the career pack, cover notes and answers,
 * saved jobs, shortlists, messages to us, and the sign-in account.
 * What stays: the candidate row under a placeholder, so applications, payments
 * and placements still add up; payment records, which tax law requires us to
 * keep; and the audit and access logs, which record what staff did, not who the
 * candidate is.
 */
export async function eraseCandidate(admin: Admin, candidateId: string): Promise<EraseResult> {
  const { data: candidate } = await admin.from('candidates').select('id, auth_user_id, erased_at').eq('id', candidateId).maybeSingle();
  if (!candidate) return { status: 'not_found' };

  const { data: active } = await admin
    .from('applications')
    .select('reference')
    .eq('candidate_id', candidateId)
    .in('status', [...ERASE_BLOCKING_STATUSES]);
  if (active && active.length > 0) {
    return { status: 'blocked', reason: 'active_process', references: active.map((a) => String(a.reference)) };
  }

  await Promise.all([
    removeFolder(admin, 'cvs', candidateId),
    removeFolder(admin, 'voice-intros', candidateId),
    removeFolder(admin, 'relocation-docs', candidateId),
  ]);

  const purge = [
    'candidate_profiles',
    'candidate_experiences',
    'candidate_education',
    'candidate_voice_intros',
    'cv_assessments',
    'career_packs',
    'reports',
    'saved_jobs',
    'shortlist_entries',
    'leads',
    'relocation_documents',
    'family_links',
    'success_stories',
    'profile_unlock_requests',
    'bench_holds',
    'legal_reviews',
    'candidate_backgrounds',
  ];
  for (const table of purge) {
    const { error } = await admin.from(table).delete().eq('candidate_id', candidateId);
    if (error) log.warn('privacy.erase_table_failed', { table, error: error.message });
  }

  await admin.from('applications').update({ cover_note: null, answers: {}, cv_document_id: null }).eq('candidate_id', candidateId);
  await admin.from('cv_documents').delete().eq('candidate_id', candidateId);

  const { error } = await admin
    .from('candidates')
    .update({
      full_name: 'Erased candidate',
      email: `erased+${candidateId}@invalid`,
      phone: '',
      phone_hash: `erased:${candidateId}`,
      passport_hash: null,
      city_state: '',
      visible_to_employers: false,
      whatsapp_opt_in_at: null,
      referral_source: null,
      auth_user_id: null,
      erased_at: new Date().toISOString(),
    })
    .eq('id', candidateId);
  if (error) throw new Error(`erase_failed: ${error.message}`);

  if (candidate.auth_user_id) {
    const { error: authError } = await admin.auth.admin.deleteUser(String(candidate.auth_user_id));
    if (authError) log.warn('privacy.erase_auth_failed', { error: authError.message });
  }

  return { status: 'erased' };
}
