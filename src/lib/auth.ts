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
  if (!staff) redirect(`/en/signin?next=${encodeURIComponent(returnTo)}`);
  return staff;
}

export type EmployerUser = { userId: string; employerId: string; name: string; role: string };

/** The signed-in employer contact, or null. */
export async function getSessionEmployer(): Promise<EmployerUser | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data } = await supabase
    .from('employer_users')
    .select('employer_id, role, employers (name)')
    .eq('auth_user_id', auth.user.id)
    .maybeSingle();

  if (!data) return null;

  const employer = data.employers as { name?: string } | { name?: string }[] | null;
  const name = Array.isArray(employer) ? (employer[0]?.name ?? '') : (employer?.name ?? '');

  return {
    userId: auth.user.id,
    employerId: data.employer_id as string,
    name,
    role: data.role as string,
  };
}

export type Viewer =
  | { role: 'candidate'; candidate: SessionCandidate }
  | { role: 'employer'; employer: EmployerUser }
  | { role: 'staff'; staff: StaffUser }
  | { role: 'anonymous' };

/**
 * Who is signed in, across all three audiences.
 *
 * Checked most-privileged first, so someone who is both staff and a candidate
 * in a test environment lands consistently rather than by whichever query
 * happened to run first.
 */
export async function getViewer(): Promise<Viewer> {
  const staff = await getSessionStaff();
  if (staff) return { role: 'staff', staff };

  const employer = await getSessionEmployer();
  if (employer) return { role: 'employer', employer };

  const candidate = await getSessionCandidate();
  if (candidate) return { role: 'candidate', candidate };

  return { role: 'anonymous' };
}

/** Where a signed-in viewer belongs when no explicit destination was asked for. */
export function homeFor(viewer: Viewer, locale: Locale): string {
  switch (viewer.role) {
    case 'staff':
      return '/admin';
    case 'employer':
      return '/admin';
    case 'candidate':
      return `/${locale}/dashboard`;
    default:
      return `/${locale}`;
  }
}

/**
 * The talent pool is open to staff and to vetted employers. What they see
 * differs: the CV assessment and its AI score are staff-only, because handing a
 * raw model score to a client employer would be indefensible.
 */
export async function requireStaffOrEmployer(
  returnTo: string,
): Promise<{ isStaff: boolean; label: string }> {
  const viewer = await getViewer();
  if (viewer.role === 'staff') return { isStaff: true, label: viewer.staff.email };
  if (viewer.role === 'employer') return { isStaff: false, label: viewer.employer.name };
  redirect(`/en/signin?next=${encodeURIComponent(returnTo)}`);
}
