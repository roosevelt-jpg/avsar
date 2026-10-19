import { getAdminSupabase } from '@/lib/supabase/admin';
import { emailStaff, notifyStaff } from '@/lib/notifications/staff';
import { getMailer } from '@/lib/email';
import { composeEmail } from '@/lib/email/compose';
import { getSiteSettings } from '@/lib/cms/data';
import { formatFee } from '@/lib/company/config';
import { localePath } from '@/lib/i18n';
import { sendWhatsApp } from '@/lib/whatsapp';
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

  /* A late "pending" or "failed" event for an order that has already been
     paid must leave the paid status alone, not just the timestamp. */
  let query = supabase.from('payments').update(update).eq('provider_order_id', input.orderId);
  if (!paid) query = query.neq('status', 'paid');
  const { error } = await query;

  if (error) console.error('[payments] row update failed', error);

  if (!paid) return;

  const { data: payment } = await supabase
    .from('payments')
    .select('candidate_id, receipt_no')
    .eq('provider_order_id', input.orderId)
    .maybeSingle();

  if (!payment?.candidate_id) {
    /* A paid order with no row is money taken for something we cannot deliver. */
    console.error('[payments] no payment row for confirmed order', input.orderId);
    return;
  }

  /* Filtered on "not yet paid" so only the first of the two callers gets a row
     back, and staff hear about each payment once rather than twice. */
  const { data: unlocked, error: unlockError } = await supabase
    .from('candidates')
    .update({ payment_status: 'paid' })
    .eq('id', payment.candidate_id)
    .neq('payment_status', 'paid')
    .select('id, full_name, email, locale');

  if (unlockError) console.error('[payments] candidate unlock failed', unlockError);

  const first = unlocked?.[0];
  if (first) {
    const name = String(first.full_name ?? 'A candidate');
    const firstName = name.split(' ')[0] || name;
    const receipt = String(payment.receipt_no ?? input.orderId);
    await notifyStaff({
      permission: 'relocation.manage',
      kind: 'payment.received',
      title: `Package bought: ${name}`,
      body: 'A preliminary legal review is now owed.',
      href: '/admin/legal-reviews',
    });
    await emailStaff({
      subject: `Payment received: ${name}`,
      line: `${name} bought the Professional Assessment and Career Preparation Package. Their preliminary legal review is now owed.`,
      href: '/admin/legal-reviews',
      actionLabel: 'Open legal reviews',
    });

    /* Receipt to the buyer. Only on the first unlock, so a double webhook
       does not send two receipts. */
    const to = typeof first.email === 'string' ? first.email : '';
    if (to) {
      try {
        const settings = await getSiteSettings();
        const origin = process.env.SITE_ORIGIN ?? 'https://recruitment.smithandadams.com';
        const locale = typeof first.locale === 'string' && first.locale ? first.locale : 'en';
        const email = await composeEmail(
          'payment_received',
          { first_name: firstName, price: formatFee(settings.pricing) },
          { origin, actionUrl: `${origin}${localePath(locale, '/dashboard')}` },
        );
        await getMailer().send({ to, ...email });
      } catch (error) {
        console.error('[payments] buyer receipt failed', error);
      }
    }

    await sendWhatsApp({
      candidateId: String(first.id),
      template: 'payment_received',
      params: [firstName, receipt],
    });
  }
}
