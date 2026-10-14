import { AdminEmpty, AdminHeading, AdminShell } from '@/components/employer/AdminShell';
import { Mono } from '@/components/ui/Mono';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Audit log' };

/** Who changed what, newest first. Append-only in the database: nothing here can be edited or removed. */
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission('audit.view', '/admin/audit');
  const { q } = await searchParams;
  const admin = getAdminSupabase();

  let rows: { id: number; actor: string | null; action: string; subject: string; detail: unknown; at: string }[] = [];
  let emails = new Map<string, string>();
  if (admin) {
    let query = admin.from('audit_log').select('id, actor, action, subject, detail, at').order('at', { ascending: false }).limit(300);
    if (q?.trim()) query = query.or(`action.ilike.%${q.trim().replace(/[%,()]/g, '')}%,subject.ilike.%${q.trim().replace(/[%,()]/g, '')}%`);
    const { data } = await query;
    rows = (data ?? []) as typeof rows;
    const actors = [...new Set(rows.map((r) => r.actor).filter(Boolean))] as string[];
    if (actors.length) {
      const { data: staff } = await admin.from('staff_users').select('auth_user_id, email').in('auth_user_id', actors);
      emails = new Map((staff ?? []).map((s) => [String(s.auth_user_id), String(s.email)]));
    }
  }

  return (
    <AdminShell current="/admin/audit" isStaff>
      <AdminHeading title="Audit log" lead="Every change made in the console: jobs, applications, pages, media, settings, staff and roles." />
      <form method="get" className="mt-6 flex gap-2">
        <input name="q" defaultValue={q ?? ''} placeholder="Filter by action or subject, e.g. cms.publish" className="w-[min(100%,360px)] rounded-full border border-line bg-surface px-4 py-2 text-[14px]" />
        <button type="submit" className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper">Filter</button>
      </form>
      {rows.length === 0 ? (
        <AdminEmpty>{admin ? 'Nothing recorded yet.' : 'Demo mode: the audit log needs Supabase.'}</AdminEmpty>
      ) : (
        <div className="scroll-x mt-6 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[820px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line">
                {['When', 'Who', 'Action', 'Subject', 'Detail'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line-soft align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5"><Mono className="text-muted">{new Date(row.at).toLocaleString('en-GB')}</Mono></td>
                  <td className="px-4 py-2.5">{row.actor ? (emails.get(row.actor) ?? row.actor.slice(0, 8)) : 'system'}</td>
                  <td className="px-4 py-2.5 font-mono">{row.action}</td>
                  <td className="px-4 py-2.5 font-mono text-ink-2">{row.subject}</td>
                  <td className="max-w-[360px] truncate px-4 py-2.5 font-mono text-[12px] text-muted" title={row.detail ? JSON.stringify(row.detail) : ''}>
                    {row.detail ? JSON.stringify(row.detail) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
