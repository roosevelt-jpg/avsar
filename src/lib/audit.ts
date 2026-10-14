import { getAdminSupabase } from '@/lib/supabase/admin';

/**
 * Writes one row to the append-only audit log.
 *
 * Every console write calls this: who did what to which thing. It never
 * throws, because an audit failure should be visible in logs rather than turn a
 * successful edit into an error the user retries (and so performs twice).
 */
export async function audit(
  actor: string | null,
  action: string,
  subject: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;
  const { error } = await admin.from('audit_log').insert({
    actor: actor && actor !== '00000000-0000-0000-0000-000000000000' ? actor : null,
    action,
    subject,
    detail: detail ?? null,
  });
  if (error) console.error('[audit] insert failed', action, subject, error);
}
