import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n';

/**
 * Session helpers.
 *
 * Every one of these resolves identity from the session cookie, never from a
 * query string or request body. RLS enforces the same boundaries at the database
 * level, so these are a convenience and a redirect, not the security control.
 */

export type SessionCandidate = {
  id: string;
  fullName: string;
  email: string;
  sector: string;
  yearsBand: number;
  paymentStatus: string;
  visibleToEmployers: boolean;
};

/** The signed-in candidate, or null. Does not redirect. */
export async function getSessionCandidate(): Promise<SessionCandidate | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data } = await supabase
    .from('candidates')
    .select(
      'id, full_name, email, sector, years_experience_band, payment_status, visible_to_employers',
    )
    .eq('auth_user_id', auth.user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    fullName: data.full_name as string,
    email: data.email as string,
    sector: data.sector as string,
    yearsBand: data.years_experience_band as number,
    paymentStatus: data.payment_status as string,
    visibleToEmployers: data.visible_to_employers as boolean,
  };
}

/** The signed-in candidate, or a redirect to sign-in carrying the return path. */
export async function requireCandidate(
  locale: Locale,
  returnTo: string,
): Promise<SessionCandidate> {
  const candidate = await getSessionCandidate();
  if (!candidate) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(returnTo)}`);
  }
  return candidate;
}

export type StaffUser = { userId: string; email: string; role: string };

/**
 * The signed-in staff member.
 *
 * Staff are a row in `staff_users`, not a flag on the auth user: a role that
 * lives in user metadata can be changed by the user, and the people using this
 * decide whether candidates advance.
 */
export async function getSessionStaff(): Promise<StaffUser | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data } = await supabase
    .from('staff_users')
    .select('role')
    .eq('auth_user_id', auth.user.id)
    .maybeSingle();

  if (!data) return null;

  return { userId: auth.user.id, email: auth.user.email ?? '', role: data.role as string };
}

export async function requireStaff(returnTo: string): Promise<StaffUser> {
  const staff = await getSessionStaff();
  if (!staff) redirect(`/admin/signin?next=${encodeURIComponent(returnTo)}`);
  return staff;
}
