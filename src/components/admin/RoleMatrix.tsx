'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PERMISSION_GROUPS } from '@/lib/rbac/permissions';

type Role = { key: string; name: string; description: string; isSystem: boolean; permissions: string[]; holders: number };

/**
 * Roles down the side, permissions across: tick to grant. Changes are saved
 * per role, so two people editing different roles do not overwrite each other.
 */
export function RoleMatrix({ roles }: { roles: Role[] }) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, Set<string>>>(() => Object.fromEntries(roles.map((r) => [r.key, new Set(r.permissions)])));
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ key: '', name: '', description: '' });

  function toggle(role: string, permission: string) {
    if (role === 'super_admin') return;
    setState((current) => {
      const next = new Set(current[role]);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return { ...current, [role]: next };
    });
    setDirty((current) => new Set(current).add(role));
  }

  async function save(role: string) {
    const response = await fetch('/api/admin/roles', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role, permissions: [...(state[role] ?? [])].filter((p) => p !== '*') }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (response.ok) {
      setDirty((current) => {
        const next = new Set(current);
        next.delete(role);
        return next;
      });
      setMessage(`Saved ${role}. Staff with this role get the change on their next page load.`);
    } else {
      setMessage(data?.error === 'demo_mode' ? 'Demo mode: nothing can be saved.' : 'Could not save.');
    }
  }

  async function create() {
    const response = await fetch('/api/admin/roles', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(newRole) });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (response.ok) {
      setNewRole({ key: '', name: '', description: '' });
      router.refresh();
      window.location.reload();
    } else setMessage(data?.error === 'role_exists' ? 'A role with that key exists.' : data?.error === 'demo_mode' ? 'Demo mode: nothing can be saved.' : 'Use a lower-case key like "regional_recruiter".');
  }

  async function remove(role: string) {
    if (!confirm(`Delete the role ${role}?`)) return;
    const response = await fetch('/api/admin/roles', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role }) });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (response.ok) window.location.reload();
    else setMessage(data?.error === 'role_in_use' ? 'Move the staff who hold this role first.' : 'Could not delete.');
  }

  const has = (role: string, permission: string) => state[role]?.has('*') || state[role]?.has(permission);

  return (
    <div className="flex flex-col gap-5">
      {message && <p className="m-0 rounded-[12px] bg-surface px-4 py-3 text-[14px]">{message}</p>}
      <div className="scroll-x rounded-[16px] border border-line bg-surface">
        <table className="w-full min-w-[1100px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              <th className="sticky start-0 bg-surface px-3 py-3 text-start font-mono text-[11px] font-normal text-muted">ROLE</th>
              {PERMISSION_GROUPS.flatMap((group) =>
                group.items.map((item) => (
                  <th key={item.key} className="px-1 py-3 align-bottom font-normal" title={item.label}>
                    <span className="block whitespace-nowrap font-mono text-[10px] text-muted [writing-mode:vertical-rl] rotate-180">{item.key}</span>
                  </th>
                )),
              )}
              <th className="px-3" />
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.key} className="border-b border-line-soft last:border-0">
                <td className="sticky start-0 min-w-[200px] bg-surface px-3 py-2.5">
                  <span className="block font-medium">{role.name}</span>
                  <span className="block font-mono text-[11px] text-muted">{role.key} · {role.holders} staff</span>
                </td>
                {PERMISSION_GROUPS.flatMap((group) =>
                  group.items.map((item) => (
                    <td key={item.key} className="px-1 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${role.name}: ${item.label}`}
                        checked={Boolean(has(role.key, item.key))}
                        disabled={role.key === 'super_admin'}
                        onChange={() => toggle(role.key, item.key)}
                      />
                    </td>
                  )),
                )}
                <td className="px-3 text-end">
                  <span className="flex justify-end gap-1.5">
                    {dirty.has(role.key) && (
                      <button type="button" onClick={() => void save(role.key)} className="cursor-pointer rounded-full border-0 bg-ink px-3 py-1 text-[12px] text-paper">Save</button>
                    )}
                    {!role.isSystem && (
                      <button type="button" onClick={() => void remove(role.key)} className="cursor-pointer rounded-full border border-line bg-paper px-3 py-1 text-[12px] text-accent-deep">Delete</button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-[18px] border border-line bg-surface p-5">
        <h2 className="m-0 text-[16px] font-semibold">Create a custom role</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-[200px_1fr_2fr_auto]">
          <input className="rounded-[10px] border border-line bg-paper px-3 py-2 text-[14px]" placeholder="key, e.g. delhi_recruiter" value={newRole.key} onChange={(e) => setNewRole({ ...newRole, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} />
          <input className="rounded-[10px] border border-line bg-paper px-3 py-2 text-[14px]" placeholder="Name" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} />
          <input className="rounded-[10px] border border-line bg-paper px-3 py-2 text-[14px]" placeholder="What this role is for" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
          <button type="button" onClick={() => void create()} className="cursor-pointer rounded-full border-0 bg-ink px-5 py-2 text-[14px] text-paper">Create</button>
        </div>
      </div>
    </div>
  );
}
