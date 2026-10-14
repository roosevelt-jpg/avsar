import { AdminButton, AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { StaffManager } from '@/components/admin/StaffManager';
import { listRoles, listStaff } from '@/lib/rbac/data';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Staff' };

export default async function StaffPage() {
  const access = await requirePermission('staff.manage', '/admin/staff');
  const [staff, roles] = await Promise.all([listStaff(), listRoles()]);
  /* Only someone who can manage roles may hand out super admin. */
  const grantable = roles.filter((role) => role.key !== 'super_admin' || can(access, 'roles.manage'));
  return (
    <AdminShell current="/admin/staff" isStaff>
      <AdminHeading
        title="Staff"
        lead="Everyone who can sign in to the console, and their role. Deactivating someone removes their access at once; their history in the audit log stays."
        actions={can(access, 'roles.manage') ? <AdminButton href="/admin/roles" variant="light">Edit roles</AdminButton> : null}
      />
      <div className="mt-8">
        <StaffManager staff={staff} roles={grantable.map((r) => ({ key: r.key, name: r.name }))} currentUserId={access.userId} />
      </div>
    </AdminShell>
  );
}
