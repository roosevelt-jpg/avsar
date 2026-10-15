import { redirect } from 'next/navigation';
import { AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { TwoFactorSetup } from '@/components/admin/TwoFactorSetup';
import { defaultLocale, localePath } from '@/lib/i18n';
import { getStaffAccess, staffMfaRequired } from '@/lib/rbac/server';

export const metadata = { title: 'Sign-in security', robots: { index: false } };

/**
 * Where a member of staff adds an authenticator app, and where they are sent
 * to enter its code when two-factor sign-in is enforced. Any staff role may
 * open it, including a session that has not passed the second factor yet:
 * otherwise nobody could ever enrol.
 */
export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const access = await getStaffAccess();
  if (!access) redirect(localePath(defaultLocale, `/signin?next=${encodeURIComponent('/admin/security')}`));
  const { next } = await searchParams;
  /* Only a path inside the console, so the redirect cannot be pointed elsewhere. */
  const returnTo = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin/dashboard';

  return (
    <AdminShell current="/admin/security" isStaff>
      <AdminHeading
        title="Sign-in security"
        lead={
          access.needsSecondFactor
            ? 'Staff accounts need a code from an authenticator app as well as the sign-in link. Set one up, or enter the current code, to continue.'
            : 'Add an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password and others) so that a stolen inbox is not enough to open the console.'
        }
      />
      <div className="mt-6 max-w-[560px]">
        <TwoFactorSetup enforced={staffMfaRequired()} returnTo={returnTo} />
      </div>
    </AdminShell>
  );
}
