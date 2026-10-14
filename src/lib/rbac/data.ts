import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { SYSTEM_ROLES } from './permissions';

export type RoleRow = { key: string; name: string; description: string; isSystem: boolean; permissions: string[]; holders: number };
export type StaffRow = { userId: string; email: string; fullName: string | null; role: string; active: boolean; createdAt: string };

const DEMO_PERMS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: ['dashboard.view', 'jobs.view', 'jobs.edit', 'jobs.publish', 'applications.view', 'applications.manage', 'candidates.view', 'candidates.export', 'cv.review', 'employers.manage', 'placements.manage', 'cms.view', 'cms.edit', 'cms.publish', 'media.manage', 'settings.manage', 'payments.view', 'payments.refund', 'staff.manage', 'audit.view'],
  recruiter: ['dashboard.view', 'jobs.view', 'jobs.edit', 'jobs.publish', 'applications.view', 'applications.manage', 'candidates.view', 'cv.review', 'employers.manage', 'placements.manage'],
  reviewer: ['dashboard.view', 'applications.view', 'candidates.view', 'cv.review', 'jobs.view'],
  content_editor: ['dashboard.view', 'cms.view', 'cms.edit', 'media.manage', 'jobs.view'],
  content_manager: ['dashboard.view', 'cms.view', 'cms.edit', 'cms.publish', 'media.manage', 'settings.manage', 'jobs.view'],
  finance: ['dashboard.view', 'payments.view', 'payments.refund', 'candidates.view'],
  support: ['dashboard.view', 'jobs.view', 'applications.view', 'candidates.view', 'payments.view'],
};

export async function listRoles(): Promise<RoleRow[]> {
  if (!isSupabaseConfigured()) {
    return SYSTEM_ROLES.map((role) => ({ ...role, isSystem: true, permissions: DEMO_PERMS[role.key] ?? [], holders: role.key === 'super_admin' ? 1 : 0 }));
  }
  const admin = getAdminSupabase();
  if (!admin) return [];
  const [{ data: roles }, { data: perms }, { data: staff }] = await Promise.all([
    admin.from('roles').select('key, name, description, is_system').order('created_at'),
    admin.from('role_permissions').select('role_key, permission_key'),
    admin.from('staff_users').select('role'),
  ]);
  return (roles ?? []).map((role) => ({
    key: String(role.key),
    name: String(role.name),
    description: String(role.description ?? ''),
    isSystem: Boolean(role.is_system),
    permissions: (perms ?? []).filter((p) => p.role_key === role.key).map((p) => String(p.permission_key)),
    holders: (staff ?? []).filter((s) => s.role === role.key).length,
  }));
}

export async function listStaff(): Promise<StaffRow[]> {
  if (!isSupabaseConfigured()) {
    return [
      { userId: 'demo-1', email: 'owner@example.com', fullName: 'Platform owner', role: 'super_admin', active: true, createdAt: '2026-09-01T00:00:00Z' },
      { userId: 'demo-2', email: 'recruiter@example.com', fullName: 'Recruiter', role: 'recruiter', active: true, createdAt: '2026-09-10T00:00:00Z' },
      { userId: 'demo-3', email: 'content@example.com', fullName: 'Content editor', role: 'content_editor', active: true, createdAt: '2026-09-12T00:00:00Z' },
    ];
  }
  const admin = getAdminSupabase();
  const { data } = (await admin?.from('staff_users').select('auth_user_id, email, full_name, role, active, created_at').order('created_at')) ?? { data: null };
  return (data ?? []).map((row) => ({
    userId: String(row.auth_user_id),
    email: String(row.email),
    fullName: (row.full_name as string | null) ?? null,
    role: String(row.role),
    active: row.active !== false,
    createdAt: String(row.created_at),
  }));
}
