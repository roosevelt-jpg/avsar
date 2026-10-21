import { asPaidProduct, productGrants } from '@/lib/company/config';
import { getAdminSupabase } from '@/lib/supabase/admin';

export type Entitlements = {
  skills: boolean;
  visa: boolean;
};

const NONE: Entitlements = { skills: false, visa: false };

/**
 * Which of the two paid documents this candidate owns.
 *
 * `payment_status = paid` is the old package, or a bundle, or the second
 * purchase that completed the pair. A single report must not set that flag,
 * or the other document would open with it. The candidate id comes from the
 * session. The service role is used because this decision has to see every
 * paid row, including ones written before the candidate's own policies did.
 */
export async function candidateEntitlements(
  candidateId: string,
  paymentStatus: string,
): Promise<Entitlements> {
  if (paymentStatus === 'paid') return { skills: true, visa: true };

  const admin = getAdminSupabase();
  if (!admin) return NONE;

  const { data, error } = await admin
    .from('payments')
    .select('product, status')
    .eq('candidate_id', candidateId)
    .eq('status', 'paid');

  if (error) {
    console.error('[entitlements] payments read failed', error);
    return NONE;
  }

  let skills = false;
  let visa = false;
  for (const row of data ?? []) {
    const grants = productGrants(asPaidProduct(row.product));
    skills = skills || grants.skills;
    visa = visa || grants.visa;
  }
  return { skills, visa };
}
