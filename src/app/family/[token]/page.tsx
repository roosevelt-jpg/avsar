import type { Metadata } from 'next';
import { Wordmark } from '@/components/ui/Wordmark';
import { familyView } from '@/lib/relocation/data';
import { milestoneTemplate, nextMilestone, progress } from '@/lib/relocation/milestones';

/* The link is private and personal: never indexed, never sent on as a referrer. */
export const metadata: Metadata = { title: 'Progress', robots: { index: false, follow: false }, referrer: 'no-referrer' };

/**
 * What a candidate's family sees: the job, the city, and each step with its
 * date. Written for a parent reading it on a phone: no jargon, no salary, no
 * employer name, no documents, and nothing that would help a stranger
 * contact the candidate.
 */
export default async function FamilyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await familyView(token);

  return (
    <div className="avsar-root min-h-dvh">
      <header className="border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href="/" />
      </header>
      <main className="mx-auto w-full max-w-[680px] px-[clamp(20px,4cqi,56px)] py-[clamp(28px,5cqi,56px)]">
        {!view ? (
          <div className="rounded-[20px] border border-line bg-surface p-6">
            <h1 className="m-0 text-[24px] font-semibold">This link does not work</h1>
            <p className="mt-2 mb-0 text-[16px] leading-[1.6] text-ink-2">
              It may have been switched off. Please ask the person who sent it for a new one.
            </p>
          </div>
        ) : (
          <FamilyProgress view={view} />
        )}
      </main>
    </div>
  );
}

function FamilyProgress({ view }: { view: NonNullable<Awaited<ReturnType<typeof familyView>>> }) {
  const { done, total } = progress(view.milestones);
  const next = nextMilestone(view.milestones);
  return (
    <>
      <p className="m-0 font-mono text-[12px] uppercase tracking-[0.12em] text-accent">{view.firstName}&apos;s move to Portugal</p>
      <h1 className="m-0 mt-2 text-[clamp(26px,4cqi,38px)] font-semibold leading-[1.1] tracking-[-0.02em]">
        {view.jobTitle}, {view.city}
      </h1>
      <p className="mt-3 mb-0 text-[16px] leading-[1.6] text-ink-2">
        {total === 0
          ? 'The plan has not been set up yet. It appears here as soon as it is.'
          : `${done} of ${total} steps done.${next ? ` Next: ${(milestoneTemplate(next.key)?.label ?? next.key).toLowerCase()}.` : ''}`}
      </p>

      <ol className="m-0 mt-8 flex list-none flex-col p-0">
        {[...view.milestones].sort((a, b) => a.position - b.position).filter((m) => m.status !== 'skipped').map((m) => {
          const template = milestoneTemplate(m.key);
          return (
            <li key={m.id} className={`relative border-s-2 ps-5 pb-5 last:pb-0 ${m.status === 'done' ? 'border-success' : 'border-line'}`}>
              <span aria-hidden className={`absolute -start-[7px] top-1.5 size-3 rounded-full ${m.status === 'done' ? 'bg-success' : m.id === next?.id ? 'bg-accent' : 'bg-line-strong'}`} />
              <p className={`m-0 text-[16px] ${m.id === next?.id ? 'font-semibold' : ''}`}>
                {m.status === 'done' ? '✓ ' : ''}
                {template?.label ?? m.key}
              </p>
              <p className="mt-0.5 mb-0 font-mono text-[12px] text-muted">
                {m.status === 'done' && m.doneAt ? `Done ${new Date(m.doneAt).toLocaleDateString('en-GB')}` : m.dueOn ? `Expected around ${new Date(m.dueOn).toLocaleDateString('en-GB')}` : ''}
              </p>
            </li>
          );
        })}
      </ol>

      <p className="mt-10 mb-0 text-[14px] leading-[1.6] text-muted">
        Dates are estimates. Visa decisions are made by the Portuguese embassy and can take longer. We never ask families for money:
        if anyone does in our name, please tell us through the contact page.
      </p>
    </>
  );
}
