'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Staff = { userId: string; email: string; fullName: string | null; role: string; active: boolean; createdAt: string };
type Role = { key: string; name: string };

const INPUT = 'rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink';

const ERRORS: Record<string, string> = {
  not_configured: 'The database is not connected, so nothing was saved.',
  forbidden: 'Only a super admin can grant or change the super admin role.',
  email_is_candidate: 'This email belongs to a candidate account. Use a work email.',
  cannot_change_self: 'You cannot change your own role or deactivate yourself.',
  last_super_admin: 'This is the last active super admin. Add another one first.',
  unknown_role: 'That role does not exist.',
  validation_failed: 'Check the name and email.',
};

export function StaffManager({ staff, roles, currentUserId }: { staff: Staff[]; roles: Role[]; currentUserId: string }) {
  const router = useRouter();
  const [invite, setInvite] = useState({ email: '', fullName: '', role: roles.find((r) => r.key === 'recruiter')?.key ?? roles[0]?.key ?? '' });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(method: 'POST' | 'PATCH', body: unknown, success: string) {
    setBusy(true);
    setMessage(null);
    const response = await fetch('/api/admin/staff', { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => null)) as { error?: string; emailSent?: boolean } | null;
    setBusy(false);
    if (response.ok) {
      setMessage(data?.emailSent === false ? `${success} The invitation email could not be sent; ask them to use "Forgot password".` : success);
      router.refresh();
      return true;
    }
    setMessage(ERRORS[data?.error ?? ''] ?? 'That did not work.');
    return false;
  }

  const roleName = (key: string) => roles.find((r) => r.key === key)?.name ?? key;

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await send('POST', invite, `Invitation sent to ${invite.email}.`)) setInvite({ ...invite, email: '', fullName: '' });
        }}
        className="rounded-[18px] border border-line bg-surface p-5"
      >
        <h2 className="m-0 text-[16px] font-semibold">Invite a staff member</h2>
        <p className="m-0 mt-1 text-[13px] text-muted">They receive an email to set their own password. Their role decides what they can see and do.</p>
        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_220px_auto]">
          <input className={INPUT} placeholder="Full name" value={invite.fullName} onChange={(e) => setInvite({ ...invite, fullName: e.target.value })} required />
          <input className={INPUT} type="email" placeholder="Work email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} required />
          <select className={INPUT} value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
            {roles.map((role) => (
              <option key={role.key} value={role.key}>{role.name}</option>
            ))}
          </select>
          <button type="submit" disabled={busy} className="cursor-pointer rounded-full border-0 bg-ink px-5 py-2 text-[14px] font-medium text-paper disabled:opacity-60">Invite</button>
        </div>
        {message && <p className="m-0 mt-3 text-[14px] text-ink-2">{message}</p>}
      </form>

      <div className="scroll-x rounded-[16px] border border-line bg-surface">
        <table className="w-full min-w-[720px] border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-line">
              {['Person', 'Role', 'Status', 'Since', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-start font-mono text-[12px] font-normal text-muted">{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((person) => {
              const self = person.userId === currentUserId;
              return (
                <tr key={person.userId} className={`border-b border-line-soft last:border-0 ${person.active ? '' : 'opacity-60'}`}>
                  <td className="px-4 py-3">
                    <span className="block font-medium">{person.fullName ?? person.email}{self ? ' (you)' : ''}</span>
                    <span className="block text-[12px] text-muted">{person.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    {self ? (
                      roleName(person.role)
                    ) : (
                      <select className={INPUT} value={person.role} disabled={busy} onChange={(e) => void send('PATCH', { userId: person.userId, role: e.target.value }, 'Role updated.')}>
                        {roles.map((role) => (
                          <option key={role.key} value={role.key}>{role.name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">{person.active ? 'Active' : 'Deactivated'}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{new Date(person.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-end">
                    {!self && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          (person.active ? confirm(`Deactivate ${person.email}? They lose access immediately.`) : true) &&
                          void send('PATCH', { userId: person.userId, active: !person.active }, person.active ? 'Deactivated.' : 'Reactivated.')
                        }
                        className="cursor-pointer rounded-full border border-line bg-paper px-3 py-1 text-[13px]"
                      >
                        {person.active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
