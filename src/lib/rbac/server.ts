import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getSessionStaff, getViewer, homeFor } from '@/lib/auth';
import { defaultLocale, localePath } from '@/lib/i18n';
import { grants, type Permission } from './permissions';

/**
 * Staff access, resolved once per request.
 *
 * Every console page and every admin API route goes through `requirePermission`
 * or `apiPermission`. Both check a permission, never a role name, so adding a
 * role is a row in the database rather than a code change.
 *
 * RLS checks the same permissions through `has_permission()`, so these guards
 * are the redirect and the friendly error, not the only control.
 */

export type StaffAccess = {
  userId: string;
  email: string;
  role: string;
  permissions: ReadonlySet<string>;
  /**
   * Two-factor sign-in is enforced and this session has not passed it yet.
   * Such a session can reach `/admin/security` to set up or enter a code,
   * and nothing else.
   */
  needsSecondFactor: boolean;
};

/**
 * Staff can read candidates' passports and police certificates, so a stolen
 * password alone should not be enough. With `STAFF_REQUIRE_MFA=true`, every
 * console page and admin API needs a session that has passed an authenticator
 * code (Supabase calls this assurance level aal2). Off by default so a new
 * deployment is not locked out before anyone has enrolled.
 */
export function staffMfaRequired(): boolean {
  return process.env.STAFF_REQUIRE_MFA === 'true';
}

export async function getStaffAccess(): Promise<StaffAccess | null> {
  /* With no database there is no session to check, so nobody is staff. */
  if (!isSupabaseConfigured()) return null;

  const staff = await getSessionStaff();
  if (!staff) return null;

  const supabase = await getServerSupabase();
  const { data, error } = (await supabase?.rpc('my_permissions')) ?? { data: null, error: null };
  if (error) console.error('[rbac] my_permissions failed', error);

  const permissions = new Set<string>(
    Array.isArray(data) ? (data as unknown[]).map((row) => String(typeof row === 'string' ? row : (row as Record<string, unknown>).my_permissions ?? '')) : [],
  );

  let needsSecondFactor = false;
  if (staffMfaRequired() && supabase) {
    const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    needsSecondFactor = level?.currentLevel !== 'aal2';
  }

  return { userId: staff.userId, email: staff.email, role: staff.role, permissions, needsSecondFactor };
}

export function can(access: StaffAccess | null, permission: Permission): boolean {
  return Boolean(access && grants(access.permissions, permission));
}

/**
 * For console pages. Anonymous viewers go to sign-in; signed-in viewers without
 * the permission go to a page that says so, rather than a 404 that looks like a
 * broken link.
 */
export async function requirePermission(permission: Permission, returnTo: string): Promise<StaffAccess> {
  const access = await getStaffAccess();
  if (access?.needsSecondFactor) redirect(`/admin/security?next=${encodeURIComponent(returnTo)}`);
  if (access && can(access, permission)) return access;

  if (access) redirect(`/admin/forbidden?need=${encodeURIComponent(permission)}`);

  const viewer = await getViewer();
  if (viewer.role !== 'anonymous' && viewer.role !== 'staff') redirect(homeFor(viewer, defaultLocale));
  redirect(localePath(defaultLocale, `/signin?next=${encodeURIComponent(returnTo)}`));
}

/**
 * For API routes. Returns the access, or a response to send back.
 *
 *   const guard = await apiPermission('jobs.edit');
 *   if (guard instanceof NextResponse) return guard;
 */
const SECOND_FACTOR_NEEDED = () => NextResponse.json({ error: 'mfa_required' }, { status: 403 });

export async function apiPermission(permission: Permission): Promise<StaffAccess | NextResponse> {
  const access = await getStaffAccess();
  if (!access) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (access.needsSecondFactor) return SECOND_FACTOR_NEEDED();
  if (!can(access, permission)) {
    return NextResponse.json({ error: 'forbidden', need: permission }, { status: 403 });
  }
  return access;
}

/** Like apiPermission, but any one of several permissions is enough. */
export async function apiAnyPermission(permissions: Permission[]): Promise<StaffAccess | NextResponse> {
  const access = await getStaffAccess();
  if (!access) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (access.needsSecondFactor) return SECOND_FACTOR_NEEDED();
  if (!permissions.some((permission) => can(access, permission))) {
    return NextResponse.json({ error: 'forbidden', need: permissions.join(' | ') }, { status: 403 });
  }
  return access;
}

/**
 * For the few routes about the member of staff themselves (marking their own
 * notifications read), where any staff role will do and no permission names
 * the action.
 */
export async function apiStaff(): Promise<StaffAccess | NextResponse> {
  const access = await getStaffAccess();
  if (!access) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return access.needsSecondFactor ? SECOND_FACTOR_NEEDED() : access;
}
