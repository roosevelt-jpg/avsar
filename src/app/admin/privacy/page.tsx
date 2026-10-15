import Link from 'next/link';
import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { PrivacyActions } from '@/components/admin/PrivacyActions';
import { Mono } from '@/components/ui/Mono';
import { listLeads, LEAD_STATUS_LABELS, LEAD_STATUS_TONE } from '@/lib/leads/data';
import { ACCESS_LABELS, accessLog, getPrivacyCandidate, searchPrivacyCandidates, type AccessEntry } from '@/lib/privacy/data';
import { requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Privacy' };

type Search = { q?: string; candidate?: string };

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

function LogTable({ rows, showCandidate }: { rows: AccessEntry[]; showCandidate: boolean }) {
  if (rows.length === 0) return <AdminEmpty>Nothing recorded yet.</AdminEmpty>;
  return (
    <div className="scroll-x mt-3 rounded-[16px] border border-line bg-surface">
      <table className="w-full min-w-[620px] border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-line">
            {['When', 'Who', 'What', ...(showCandidate ? ['Candidate'] : [])].map((h) => (
              <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line-soft last:border-0">
              <td className="px-4 py-2.5"><Mono className="text-muted">{when(row.createdAt)}</Mono></td>
              <td className="px-4 py-2.5">{row.actorEmail ?? (row.actor ? 'Staff (removed)' : 'The candidate')}</td>
              <td className="px-4 py-2.5">{ACCESS_LABELS[row.action] ?? row.action}</td>
              {showCandidate && (
                <td className="px-4 py-2.5">
                  {row.candidateId ? <Link href={`/admin/privacy?candidate=${row.candidateId}`}>Open</Link> : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Requests about personal data, answered in one place: find the person,
 * export what we hold, erase it, and see who has looked at it. Every action
 * here is itself recorded in the access log it displays.
 */
export default async function PrivacyPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requirePermission('privacy.manage', '/admin/privacy');
  const search = await searchParams;
  const candidateId = search.candidate && /^[0-9a-f-]{36}$/i.test(search.candidate) ? search.candidate : undefined;

  const [results, selected, requests, recent] = await Promise.all([
    search.q ? searchPrivacyCandidates(search.q) : Promise.resolve([]),
    candidateId ? getPrivacyCandidate(candidateId) : Promise.resolve(null),
    listLeads({ kind: 'privacy' }),
    candidateId ? Promise.resolve([]) : accessLog({ limit: 50 }),
  ]);
  const openRequest = selected ? requests.find((r) => r.candidateId === selected.candidate.id) : undefined;

  return (
    <AdminShell current="/admin/privacy" isStaff>
      <AdminHeading
        title="Privacy"
        lead="Access, correction and erasure requests. Answer within one month of the request. Payments and the audit log are kept after an erasure, because the law requires it; everything that identifies the person is removed."
      />

      <form method="get" action="/admin/privacy" className="mt-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={search.q ?? ''} placeholder="Email, name or phone (at least 3 characters)" className="w-[min(100%,380px)] rounded-full border border-line bg-surface px-4 py-2 text-[14px]" />
        <button type="submit" className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper">Find</button>
      </form>

      {search.q && (
        results.length === 0 ? (
          <AdminEmpty>Nobody matches “{search.q}”.</AdminEmpty>
        ) : (
          <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
            {results.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/privacy?candidate=${c.id}`} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-line bg-surface px-4 py-3 text-ink no-underline hover:border-ink">
                  <span className="font-medium">{c.fullName}</span>
                  <span className="text-[14px] text-muted">{c.email}</span>
                  {c.erasedAt && <Pill tone="muted">Erased</Pill>}
                </Link>
              </li>
            ))}
          </ul>
        )
      )}

      {selected && (
        <section className="mt-8 rounded-[16px] border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 text-[19px] font-semibold">{selected.candidate.fullName}</h2>
            {selected.candidate.erasedAt && <Pill tone="muted">Erased {when(selected.candidate.erasedAt)}</Pill>}
          </div>
          <p className="mt-1 mb-0 text-[14px] text-muted">
            {selected.candidate.email} · {selected.candidate.phone || 'no phone'} · registered {when(selected.candidate.createdAt)}
          </p>

          <PrivacyActions
            candidateId={selected.candidate.id}
            erased={Boolean(selected.candidate.erasedAt)}
            blockingReferences={selected.candidate.blockingReferences}
            leadId={openRequest?.id}
          />

          <h3 className="mt-7 mb-0 text-[16px] font-semibold">Consents</h3>
          {selected.consents.length === 0 ? (
            <p className="mt-2 mb-0 text-[14px] text-muted">No consent changes recorded.</p>
          ) : (
            <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-[14px]">
              {selected.consents.map((c) => (
                <li key={`${c.consent}-${c.createdAt}`}>
                  <Mono className="text-muted">{when(c.createdAt)}</Mono> · {c.consent.replace(/_/g, ' ')}: {c.granted ? 'given' : 'withdrawn'}
                  {c.source ? ` (${c.source.replace(/_/g, ' ')})` : ''}
                  {c.version ? `, version ${c.version}` : ''}
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-7 mb-0 text-[16px] font-semibold">Who has opened this person’s data</h3>
          <LogTable rows={selected.log} showCandidate={false} />
        </section>
      )}

      {!selected && (
        <>
          <h2 className="mt-9 mb-0 text-[19px] font-semibold">Open requests</h2>
          {requests.length === 0 ? (
            <AdminEmpty>No open privacy requests.</AdminEmpty>
          ) : (
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-line bg-surface px-4 py-3">
                  <span className="font-medium">{r.fullName}</span>
                  <span className="text-[14px] text-ink-2">{r.message?.split('\n')[0]}</span>
                  <Pill tone={LEAD_STATUS_TONE[r.status]}>{LEAD_STATUS_LABELS[r.status]}</Pill>
                  <Mono className="text-muted">{when(r.createdAt)}</Mono>
                  <span className="ms-auto flex gap-3 text-[14px]">
                    {r.candidateId && <Link href={`/admin/privacy?candidate=${r.candidateId}`}>Open person</Link>}
                    <Link href={`/admin/inbox/${r.id}`}>Conversation</Link>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-9 mb-0 text-[19px] font-semibold">Recent access</h2>
          <LogTable rows={recent} showCandidate />
        </>
      )}
    </AdminShell>
  );
}
