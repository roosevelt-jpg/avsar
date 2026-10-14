import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { defaultLocale, type Locale } from '@/lib/i18n';

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
  /** Null until the profile step is done. The account exists before it. */
  sector: string | null;
  position: string | null;
  locale: string;
  yearsBand: number | null;
  paymentStatus: string;
  visibleToEmployers: boolean;
  /** Profile step finished. Payment is not offered before this. */
  profileComplete: boolean;
  /**
   * The address has been proved.
   *
   * Nothing in the funnel waits for this: the account is usable from the
   * moment it is created, because a funnel that stalls on an email arriving in
   * the right browser is a funnel that loses people for reasons they cannot
   * see or fix. The report is what waits, because the report is delivered to
   * this address and sending it somewhere unproved is the actual harm.
   */
  emailConfirmed: boolean;
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
      'id, full_name, email, sector, position, locale, years_experience_band, payment_status, visible_to_employers, profile_completed_at, email_verified_at',
    )
    .eq('auth_user_id', auth.user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    fullName: data.full_name as string,
    email: data.email as string,
    sector: (data.sector as string | null) ?? null,
    position: (data.position as string | null) ?? null,
    locale: (data.locale as string | null) ?? 'en',
    yearsBand: (data.years_experience_band as number | null) ?? null,
    paymentStatus: data.payment_status as string,
    visibleToEmployers: data.visible_to_employers as boolean,
    profileComplete: Boolean(data.profile_completed_at),
    /**
     * Only our own stamp counts.
     *
     * This used to fall back to `auth.users.email_confirmed_at`, which was
     * wrong in exactly the configuration we ship: with Supabase's "Confirm
     * email" off, and with accounts created by the service role, that column is
     * set at the moment the account exists. Reading it as proof made the report
     * gate pass for everybody, which is the same as having no gate.
     *
     * A row cannot say whether that column was set by a real confirmation or by
     * auto-confirmation, so it cannot be trusted either way.
     * `email_verified_at` is written in one place only, `/auth/callback`, and
     * only for someone who followed a link sent to that address.
     */
    emailConfirmed: Boolean(data.email_verified_at),
  };
}

/**
 * Whether the fee has been paid.
 *
 * The one gate behind everything the assessment produces: the report, the
 * career pack and the CV. Sitting the assessment is free and seeing the score
 * on screen is free; taking the documents away is what is bought.
 */
export function hasPaid(candidate: SessionCandidate): boolean {
  return candidate.paymentStatus === 'paid';
}

/**
 * Everything the report download needs, in one place so the callers agree.
 *
 * Two conditions, for two different reasons. Paid, because the report is the
 * thing the fee buys. Email proved, because the report is delivered to that
 * address and carries their name, score and rank.
 */
export function canReceiveReport(candidate: SessionCandidate): boolean {
  return hasPaid(candidate) && candidate.emailConfirmed;
}

/** The signed-in candidate, or a redirect to sign-in carrying the return path. */
export async function requireCandidate(
  locale: Locale,
  returnTo: string,
): Promise<SessionCandidate> {
  const candidate = await getSessionCandidate();
  if (candidate) return candidate;

  /* Someone signed in who is not a candidate goes to their own home, not to
     sign-in. Sending them to sign-in would be both untrue and a loop: the
     sign-in page sees a session and sends them straight back here. */
  const viewer = await getViewer();
  if (viewer.role !== 'anonymous') redirect(homeFor(viewer, locale));

  redirect(`/${locale}/signin?next=${encodeURIComponent(returnTo)}`);
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
  if (staff) return staff;

  /* Signed in but not staff: send them home rather than to sign-in, which
     would be untrue and would bounce them straight back here. */
  const viewer = await getViewer();
  if (viewer.role !== 'anonymous') redirect(homeFor(viewer, defaultLocale));

  redirect(`/${defaultLocale}/signin?next=${encodeURIComponent(returnTo)}`);
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
  /**
   * Signed in, but no candidate row.
   *
   * It should not happen now that registration writes the row in the same
   * request that creates the account, but it is reachable: a deleted candidate
   * whose auth user survived, or a staff account that has not been added to
   * `staff_users` yet.
   *
   * It exists because the alternative is worse. Reporting these people as
   * anonymous sends them to sign-in, where the page sees no viewer and shows
   * the form, so they sign in, bounce off the same guard, and come back. That
   * loop is the exact shape of two bugs this project has already had, and the
   * fix both times was to give the state a name.
   */
  | { role: 'registered'; userId: string; email: string }
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

  /* A session with none of the three roles attached. Named rather than folded
     into anonymous, so the guards can send them somewhere true. */
  const supabase = await getServerSupabase();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (data.user) {
    return { role: 'registered', userId: data.user.id, email: data.user.email ?? '' };
  }

  return { role: 'anonymous' };
}

/** Whether a role is allowed on a given path at all. */
export function canReach(viewer: Viewer, path: string): boolean {
  if (path.startsWith('/admin')) return viewer.role === 'staff' || viewer.role === 'employer';

  /* The assessment is free to sit; the fee unlocks what it produces. So these
     are the same check now, and the gate lives on the report, the career pack
     and the CV instead. */
  if (path.includes('/assessment') || path.includes('/dashboard')) {
    return viewer.role === 'candidate';
  }
  return true;
}

/**
 * Where to send a signed-in viewer, honouring an explicit destination only when
 * it is same-origin AND their role can actually reach it.
 *
 * The role check is what stops a redirect loop: without it, a staff member
 * following a link to the assessment gets bounced to sign-in, which sees a
 * session and sends them back to the assessment, for ever.
 */
export function resolveDestination(viewer: Viewer, next: string | undefined, locale: Locale): string {
  const home = homeFor(viewer, locale);
  if (!next || !next.startsWith('/') || next.startsWith('//')) return home;
  return canReach(viewer, next) ? next : home;
}

/**
 * Where a signed-in viewer belongs when no explicit destination was asked for.
 *
 * For a candidate this is the resume point, not a fixed page. Someone who
 * registered and left comes back, or follows the confirmation link days later,
 * and lands on the step they actually stopped at. Sending everyone to the
 * dashboard would show an unpaid candidate a dashboard with nothing in it and
 * no obvious way forward.
 */
export function homeFor(viewer: Viewer, locale: Locale): string {
  switch (viewer.role) {
    case 'staff':
    case 'employer':
      return '/admin';
    case 'candidate':
      /* Profile, then assessment, then pay. The dashboard is where an unpaid
         candidate who has finished is sent, because that is where the fee is
         asked for and where the locked report sits. */
      if (!viewer.candidate.profileComplete) return `/${locale}/signup?resume=profile`;
      return `/${locale}/dashboard`;
    case 'registered':
      /* Signed in with nothing attached. The application is the only thing
         they can usefully do, and it will find their account. */
      return `/${locale}/signup`;
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

  /* A signed-in candidate goes to their dashboard, not to a sign-in page that
     would tell them to authenticate when they already have. */
  if (viewer.role === 'candidate') redirect(homeFor(viewer, defaultLocale));

  redirect(`/${defaultLocale}/signin?next=${encodeURIComponent(returnTo)}`);
}
