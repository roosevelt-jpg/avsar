import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { RoleMatrix } from '@/components/admin/RoleMatrix';
import { listRoles } from '@/lib/rbac/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Roles & permissions' };

export default async function RolesPage() {
  await requirePermission('roles.manage', '/admin/roles');
  const roles = await listRoles();
  return (
    <AdminShell current="/admin/roles" isStaff>
      <AdminHeading
        title="Roles and permissions"
        lead="Each role is a set of permissions. The console, every API route and the database itself check these permissions, never role names. Super admin always has everything."
      />
      <div className="mt-8">
        <RoleMatrix roles={roles} />
      </div>
    </AdminShell>
  );
}
