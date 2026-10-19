import Link from 'next/link';
import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { UnlockDecision } from '@/components/admin/HiringActions';
import { Mono } from '@/components/ui/Mono';
import { listUnlockRequests } from '@/lib/hiring/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Profile requests' };

/**
 * Employers see applicants with a shortened name. When one wants the full
 * name, usually to arrange a second interview or an offer, the request lands
 * here. Releasing it is logged on the candidate's record.
 */
export default async function AdminUnlocks() {
  await requirePermission('relocation.manage', '/admin/unlocks');
  const requests = await listUnlockRequests();

  return (
    <AdminShell current="/admin/unlocks" isStaff>
      <AdminHeading
        title="Profile requests"
        lead="Employers asking to see an applicant's full name. Release it when the reason is about hiring this person; decline anything else. Contact details are never released here: introductions go through the recruiter."
      />
      {requests.length === 0 ? (
        <AdminEmpty>No requests.</AdminEmpty>
      ) : (
        <ul className="m-0 mt-7 flex list-none flex-col gap-3 p-0">
          {requests.map((r) => (
            <li key={r.id} className="rounded-[16px] border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{r.employerName}</span>
                <span className="text-ink-2">asks about</span>
                {r.applicationId ? (
                  <Link href={`/admin/applications/${r.applicationId}`} className="font-medium text-ink no-underline hover:text-employer">{r.candidateName}</Link>
                ) : (
                  <span className="font-medium">{r.candidateName}</span>
                )}
                {r.reference && <Mono className="text-muted">{r.reference}</Mono>}
                <Pill tone={r.status === 'pending' ? 'accent' : r.status === 'approved' ? 'success' : 'muted'}>{r.status}</Pill>
                <Mono className="ms-auto text-muted">{new Date(r.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</Mono>
              </div>
              <p className="mt-2 mb-0 text-[14px] text-ink-2">“{r.reason}”</p>
              {r.status === 'pending' && (
                <div className="mt-3">
                  <UnlockDecision id={r.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
