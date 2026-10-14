import { AdminButton, AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { getStaffAccess } from '@/lib/rbac/server';
import { roleName } from '@/lib/rbac/permissions';

export const metadata = { title: 'No access' };

/**
 * Where a signed-in staff member lands when their role does not include the
 * page they asked for. Says which permission is missing, so they can ask for
 * exactly that rather than "admin".
 */
export default async function Forbidden({ searchParams }: { searchParams: Promise<{ need?: string }> }) {
  const { need } = await searchParams;
  const access = await getStaffAccess();
  return (
    <AdminShell current="/admin/forbidden" isStaff={Boolean(access)}>
      <AdminHeading
        title="You do not have access to this page"
        lead={`Your role${access ? `, ${roleName(access.role)},` : ''} does not include ${need ? `the “${need}” permission` : 'this permission'}. Ask a super admin to change your role if you need it.`}
        actions={<AdminButton href="/admin/dashboard">Back to the console</AdminButton>}
      />
    </AdminShell>
  );
}
