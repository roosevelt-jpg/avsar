import type { SupabaseClient } from '@supabase/supabase-js';
import { PLACEMENT_FEE } from '@/lib/data/brand';
import { log } from '@/lib/observability/log';
import { notifyStaff } from '@/lib/notifications/staff';

/**
 * Record the employer's placement fee when an application reaches "hired".
 *
 * The fee is the employer's, never the candidate's: Portuguese law (DL
 * 260/2009) forbids charging workers for placement, so nothing is recorded
 * if the configured payer is ever not the employer. The amount is the
 * server's price in cents, fixed at the moment of hire so a later price
 * change does not rewrite old invoices. One row per application; moving to
 * hired twice does not bill twice.
 *
 * Called after the status change has been written, by routes that have
 * already checked `applications.manage`. It never throws: a missed fee row is
 * visible on the fees page and can be added by hand, a failed hire is not.
 */
export async function recordEmployerFees(admin: SupabaseClient, applicationIds: string[]): Promise<void> {
  if (PLACEMENT_FEE.payer !== 'employer' || applicationIds.length === 0) return;
  try {
    const { data } = await admin.from('applications').select('id, reference, job_postings (employer_id)').in('id', applicationIds);
    const rows = (data ?? []).flatMap((row) => {
      const job = (Array.isArray(row.job_postings) ? row.job_postings[0] : row.job_postings) as { employer_id?: string | null } | undefined;
      return job?.employer_id ? [{ application_id: String(row.id), employer_id: job.employer_id, amount_minor: PLACEMENT_FEE.eur * 100, currency: 'EUR' }] : [];
    });
    if (rows.length === 0) return;
    const { data: inserted, error } = await admin.from('employer_fees').upsert(rows, { onConflict: 'application_id', ignoreDuplicates: true }).select('id');
    if (error) {
      log.warn('fees.record_failed', { error: error.message, applications: applicationIds.length });
      return;
    }
    if (inserted && inserted.length > 0) {
      await notifyStaff({
        permission: 'fees.manage',
        kind: 'fee.pending',
        title: inserted.length === 1 ? 'A placement fee is ready to invoice' : `${inserted.length} placement fees are ready to invoice`,
        href: '/admin/fees',
      });
    }
  } catch (error) {
    log.warn('fees.record_failed', { error: error instanceof Error ? error.message : String(error) });
  }
}
