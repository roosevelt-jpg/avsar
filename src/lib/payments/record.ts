import { getAdminSupabase } from '@/lib/supabase/admin';
import type { PaymentStatus } from './types';

/**
 * Writes a confirmed payment down, and unlocks the candidate.
 *
 * Shared by the webhook and by the browser's return from checkout, because the
 * two have to agree. They were one function's worth of logic in one place; the
 * moment the second caller existed, leaving it copied would have meant the day
 * somebody fixed the webhook and not the return, or the reverse.
 *
 * Safe to run twice. Both paths can fire for the same payment, in either order,
 * and routinely will: the webhook arrives while the candidate is still being
 * redirected. Writing the same row to the same values is the whole point rather
 * than something to guard against, so there is no "already paid" branch to get
 * wrong. What the function must not do is move a row backwards, which is why a
 * failure never clears `paid_at` on a row that already has one.
 */
export async function recordPayment(input: {
  orderId: string;
  paymentId: string | null;
  status: PaymentStatus;
}): Promise<void> {
  const supabase = getAdminSupabase();
  if (!supabase) return;

  const paid = input.status === 'paid';

  const update: Record<string, unknown> = {
    provider_payment_id: input.paymentId,
    status: input.status,
  };
  /*
    Only a success sets the timestamp. A later failed notification for a payment
    that did succeed must not erase the record of when it did: the previous
    version set paid_at to null on every non-paid result, so one stray event
    could undo a real payment.
  */
  if (paid) update.paid_at = new Date().toISOString();

  const { error } = await supabase
    .from('payments')
    .update(update)
    .eq('provider_order_id', input.orderId);

  if (error) console.error('[payments] row update failed', error);

  if (!paid) return;

  const { data: payment } = await supabase
    .from('payments')
    .select('candidate_id')
    .eq('provider_order_id', input.orderId)
    .maybeSingle();

  if (!payment?.candidate_id) {
    /* A paid order with no row is money taken for something we cannot deliver. */
    console.error('[payments] no payment row for confirmed order', input.orderId);
    return;
  }

  const { error: unlockError } = await supabase
    .from('candidates')
    .update({ payment_status: 'paid' })
    .eq('id', payment.candidate_id);

  if (unlockError) console.error('[payments] candidate unlock failed', unlockError);
}
