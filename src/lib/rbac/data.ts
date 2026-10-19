import { getAdminSupabase } from '@/lib/supabase/admin';

export type RoleRow = { key: string; name: string; description: string; isSystem: boolean; permissions: string[]; holders: number };
export type StaffRow = { userId: string; email: string; fullName: string | null; role: string; active: boolean; createdAt: string };

export async function listRoles(): Promise<RoleRow[]> {
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
