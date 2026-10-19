'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { isOverdue, milestoneTemplate, nextMilestone, type Milestone } from '@/lib/relocation/milestones';

const DOT: Record<Milestone['status'], string> = {
  done: 'bg-success',
  in_progress: 'bg-accent',
  blocked: 'bg-accent-deep',
  pending: 'bg-line-strong',
  skipped: 'bg-canvas',
};

/**
 * The plan as a list the candidate can read top to bottom. The next step is
 * marked; arrival steps have a button, because only the candidate knows they
 * have landed. A blocked step shows the recruiter's note, so "waiting" always
 * says what for.
 */
export function MilestoneList({ milestones }: { milestones: Milestone[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = nextMilestone(milestones);

  async function confirm(id: string) {
    setBusy(id);
    setError(null);
    try {
      const response = await fetch(`/api/relocation/milestones/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ done: true }) });
      if (response.ok) router.refresh();
      else setError('That did not save. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <ol className="m-0 mt-5 flex list-none flex-col gap-0 p-0">
        {[...milestones].sort((a, b) => a.position - b.position).map((m) => {
          const template = milestoneTemplate(m.key);
          const late = isOverdue(m);
          return (
            <li key={m.id} className={`relative border-s-2 ps-5 pb-6 last:pb-0 ${m.status === 'done' ? 'border-success' : 'border-line'}`}>
              <span aria-hidden className={`absolute -start-[7px] top-1.5 size-3 rounded-full ${DOT[m.status]}`} />
              <p className={`m-0 text-[15px] ${m.id === next?.id ? 'font-semibold' : 'font-medium'} ${m.status === 'skipped' ? 'text-muted line-through' : ''}`}>
                {template?.label ?? m.key}
                {m.id === next?.id && <span className="ms-2 rounded-full bg-accent-tint px-2 py-0.5 text-[12px] text-accent-deep">Next</span>}
              </p>
              {template && m.status !== 'done' && <p className="mt-1 mb-0 text-[14px] text-ink-2">{template.candidateText}</p>}
              <p className="mt-1 mb-0 font-mono text-[12px] text-muted">
                {m.status === 'done' && m.doneAt
                  ? `Done ${new Date(m.doneAt).toLocaleDateString('en-GB')}`
                  : m.dueOn
                    ? `${late ? 'Was due' : 'Expected by'} ${new Date(m.dueOn).toLocaleDateString('en-GB')}`
                    : ''}
              </p>
              {m.status === 'blocked' && m.blocker && <p className="mt-1 mb-0 text-[14px] text-accent-deep">Waiting: {m.blocker}</p>}
              {template?.arrival && m.status !== 'done' && m.status !== 'skipped' && m.id === next?.id && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void confirm(m.id)}
                  className="mt-2 cursor-pointer rounded-full border-0 bg-ink px-4 py-2 text-[14px] text-paper disabled:opacity-40"
                >
                  {m.key === 'arrived' ? 'I have arrived' : m.key === 'accommodation_checkin' ? 'I have moved in' : 'Done'}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {error && <p role="alert" className="mt-3 mb-0 text-[14px] text-accent-deep">{error}</p>}
    </>
  );
}
