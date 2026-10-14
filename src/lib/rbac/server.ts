import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getSessionStaff, getViewer, homeFor } from '@/lib/auth';
import { defaultLocale } from '@/lib/i18n';
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
  /** True only when Supabase is not configured and the console is a demo. */
  demo: boolean;
};

const DEMO_ACCESS: StaffAccess = {
  userId: '00000000-0000-0000-0000-000000000000',
  email: 'demo@localhost',
  role: 'super_admin',
  permissions: new Set(['*']),
  demo: true,
};

export async function getStaffAccess(): Promise<StaffAccess | null> {
  /* A bare checkout with no database: the console is browsable with sample
     data, and every write route answers 503 because there is nowhere to write. */
  if (!isSupabaseConfigured()) return DEMO_ACCESS;

  const staff = await getSessionStaff();
  if (!staff) return null;

  const supabase = await getServerSupabase();
  const { data, error } = (await supabase?.rpc('my_permissions')) ?? { data: null, error: null };
  if (error) console.error('[rbac] my_permissions failed', error);

  const permissions = new Set<string>(
    Array.isArray(data) ? (data as unknown[]).map((row) => String(typeof row === 'string' ? row : (row as Record<string, unknown>).my_permissions ?? '')) : [],
  );

  return { userId: staff.userId, email: staff.email, role: staff.role, permissions, demo: false };
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
  if (access && can(access, permission)) return access;

  if (access) redirect(`/admin/forbidden?need=${encodeURIComponent(permission)}`);

  const viewer = await getViewer();
  if (viewer.role !== 'anonymous' && viewer.role !== 'staff') redirect(homeFor(viewer, defaultLocale));
  redirect(`/${defaultLocale}/signin?next=${encodeURIComponent(returnTo)}`);
}

/**
 * For API routes. Returns the access, or a response to send back.
 *
 *   const guard = await apiPermission('jobs.edit');
 *   if (guard instanceof NextResponse) return guard;
 */
export async function apiPermission(permission: Permission): Promise<StaffAccess | NextResponse> {
  const access = await getStaffAccess();
  if (!access) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!can(access, permission)) {
    return NextResponse.json({ error: 'forbidden', need: permission }, { status: 403 });
  }
  return access;
}

/** Like apiPermission, but any one of several permissions is enough. */
export async function apiAnyPermission(permissions: Permission[]): Promise<StaffAccess | NextResponse> {
  const access = await getStaffAccess();
  if (!access) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!permissions.some((permission) => can(access, permission))) {
    return NextResponse.json({ error: 'forbidden', need: permissions.join(' | ') }, { status: 403 });
  }
  return access;
}

/** Writes need a database. In demo mode, answer clearly instead of pretending to save. */
export function demoWriteRefusal(access: StaffAccess): NextResponse | null {
  return access.demo
    ? NextResponse.json({ error: 'demo_mode', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 })
    : null;
}
