import { getAdminSupabase } from '@/lib/supabase/admin';
import { emailStaff, notifyStaff } from '@/lib/notifications/staff';
import { getMailer } from '@/lib/email';
import { composeEmail } from '@/lib/email/compose';
import { getSiteSettings } from '@/lib/cms/data';
import { asPaidProduct, formatMoney, productGrants, type PaidProduct } from '@/lib/company/config';
import { siteText } from '@/lib/cms/localize';
import { fill, isLocale, localePath } from '@/lib/i18n';
import { candidateEntitlements } from '@/lib/payments/entitlements';
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

  /* A late "pending" or "failed" event for an order that has already been
     paid must leave the paid status alone. A success is handled below, where
     the transition itself is what decides who sends the receipt. */
  if (!paid) {
    const { error } = await supabase
      .from('payments')
      .update({ provider_payment_id: input.paymentId, status: input.status })
      .eq('provider_order_id', input.orderId)
      .neq('status', 'paid');
    if (error) console.error('[payments] row update failed', error);
    return;
  }

  /* The row's own transition is the lock. A skills-only purchase must not
     flip the candidate to paid, so the old "first candidate update" lock
     would have swallowed the receipt for that purchase. */
  const { data: marked, error: markError } = await supabase
    .from('payments')
    .update({ provider_payment_id: input.paymentId, status: 'paid', paid_at: new Date().toISOString() })
    .eq('provider_order_id', input.orderId)
    .neq('status', 'paid')
    .select('candidate_id, receipt_no, product, amount_paise');

  if (markError) console.error('[payments] row update failed', markError);

  const payment = marked?.[0];
  if (!payment?.candidate_id) {
    if (input.paymentId) {
      await supabase.from('payments').update({ provider_payment_id: input.paymentId }).eq('provider_order_id', input.orderId);
    }
    return;
  }

  const product = asPaidProduct(payment.product);
  const grants = productGrants(product);
  const owns = await candidateEntitlements(String(payment.candidate_id), 'unpaid');
  if (owns.skills && owns.visa) {
    const { error: unlockError } = await supabase
      .from('candidates')
      .update({ payment_status: 'paid' })
      .eq('id', payment.candidate_id)
      .neq('payment_status', 'paid');
    if (unlockError) console.error('[payments] candidate unlock failed', unlockError);
  }

  const { data: buyer } = await supabase
    .from('candidates')
    .select('id, full_name, email, locale')
    .eq('id', payment.candidate_id)
    .maybeSingle();

  if (!buyer) return;

  const name = String(buyer.full_name ?? 'A candidate');
  const firstName = name.split(' ')[0] || name;
  const receipt = String(payment.receipt_no ?? input.orderId);

  if (grants.visa) {
    await notifyStaff({
      permission: 'relocation.manage',
      kind: 'payment.received',
      title: `Visa requirements bought: ${name}`,
      body: 'A preliminary legal review is now owed.',
      href: '/admin/legal-reviews',
    });
    await emailStaff({
      subject: `Visa requirements bought: ${name}`,
      line: `${name} bought the visa-requirements list. Their preliminary legal review is now owed.`,
      href: '/admin/legal-reviews',
      actionLabel: 'Open legal reviews',
    });
  } else {
    await notifyStaff({
      permission: 'candidates.view',
      kind: 'payment.received',
      title: `Skills report bought: ${name}`,
      body: 'They can download the skills report. The visa list is still unpaid.',
      href: '/admin/applicants',
    });
  }

  const to = typeof buyer.email === 'string' ? buyer.email : '';
  const settings = await getSiteSettings();
  const locale = typeof buyer.locale === 'string' && isLocale(buyer.locale) ? buyer.locale : 'en';
  const paidMinor = typeof payment.amount_paise === 'number' ? payment.amount_paise : 0;
  const plainPrice = formatMoney(paidMinor, settings.pricing.chargeCurrency).replace(/[\u2066\u2069]/g, '');
  const bought = productNoun(product);
  if (to) {
    try {
      const origin = process.env.SITE_ORIGIN ?? 'https://recruitment.smithandadams.com';
      const email = await composeEmail(
        'payment_received',
        { first_name: firstName, price: formatMoney(paidMinor, settings.pricing.chargeCurrency) },
        {
          origin,
          actionUrl: `${origin}${localePath(locale, '/dashboard')}`,
          extra: [
            fill(siteText(locale, 'We received {price} for the {product}. This is not a job offer and not a visa decision.'), {
              price: plainPrice,
              product: siteText(locale, bought),
            }),
          ],
        },
      );
      await getMailer().send({ to, ...email });
    } catch (error) {
      console.error('[payments] buyer receipt failed', error);
    }
  }

  await sendWhatsApp({
    candidateId: String(buyer.id),
    template: 'payment_received',
    params: [firstName, `${plainPrice} for the ${bought}`, receipt],
  });
}

/** English noun used in the receipt. The email translates it; the WhatsApp template stays English. */
function productNoun(product: PaidProduct): string {
  if (product === 'skills_report') return 'skills report';
  if (product === 'visa_requirements') return 'visa-requirements list';
  return 'both reports';
}
