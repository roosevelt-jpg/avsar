import { getAdminSupabase } from '@/lib/supabase/admin';
import { log } from '@/lib/observability/log';

/**
 * Who looked at whose personal data.
 *
 * The audit log records what staff changed; this records what they opened.
 * A candidate who asks "who has seen my CV?" is owed an answer, and so is a
 * regulator. Written after the caller's permission check, never throws: a
 * failed log line must not stop a recruiter reading an application, but it is
 * reported so a gap in the record is noticed.
 */
export async function logDataAccess(
  actor: string | null,
  candidateId: string | null,
  action: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;
  const { error } = await admin.from('data_access_log').insert({ actor, candidate_id: candidateId, action, detail: detail ?? null });
  if (error) log.warn('privacy.access_log_failed', { action, error: error.message });
}

/** Appends to the consent history. Same rules: after the change, never throws. */
export async function recordConsent(candidateId: string, consent: string, granted: boolean, source: string, version?: string): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;
  const { error } = await admin.from('consent_events').insert({ candidate_id: candidateId, consent, granted, source, version: version ?? null });
  if (error) log.warn('privacy.consent_log_failed', { consent, error: error.message });
}
