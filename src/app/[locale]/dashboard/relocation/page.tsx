import { notFound } from 'next/navigation';
import { privateMetadata } from '@/lib/seo';
import { DashboardNav } from '@/components/candidate/DashboardNav';
import { DocumentVault } from '@/components/relocation/DocumentVault';
import { FamilyLinks } from '@/components/relocation/FamilyLinks';
import { MilestoneList } from '@/components/relocation/MilestoneList';
import { StoryForm } from '@/components/relocation/StoryForm';
import { requireCandidate } from '@/lib/auth';
import { isLocale, localePath } from '@/lib/i18n';
import { getCandidateRelocation } from '@/lib/relocation/data';
import { computeReadiness, DOCUMENT_LABELS } from '@/lib/relocation/documents';
import { MILESTONE_TEMPLATE, progress } from '@/lib/relocation/milestones';

export const metadata = privateMetadata('Your move');

/**
 * Everything between "you have the job" and "you are at work in Portugal",
 * on one page: the visa file and how complete it is, the steps with their
 * dates, a link for family, and, once placed, a story in their own words.
 *
 * The visa file is open to everyone, not only after an offer: a candidate who
 * gets their passport and police clearance checked early can travel weeks
 * sooner, and employers can see that they are ready.
 */
export default async function RelocationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const candidate = await requireCandidate(locale, localePath(locale, '/dashboard/relocation'));
  const data = await getCandidateRelocation(candidate.id);

  const readiness = computeReadiness(data.documents);
  const steps = data.plan ? progress(data.plan.milestones) : null;

  return (
    <>
      <DashboardNav locale={locale} current="relocation" />
      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(28px,5cqi,56px)]">
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-10">
          <div>
            <p className="m-0 font-mono text-[12px] uppercase tracking-[0.12em] text-accent">Your move</p>
            <h1 className="m-0 mt-2 text-[clamp(28px,4cqi,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
              {data.plan ? `${data.plan.jobTitle}, ${data.plan.city}` : 'Get your visa file ready'}
            </h1>
            <p className="mt-3 mb-0 max-w-[62ch] text-[16px] leading-[1.6] text-ink-2">
              {steps
                ? `${steps.done} of ${steps.total} steps done. Dates are our best estimate; embassy processing times vary, and we update them as we hear.`
                : 'Upload your documents now and we check each one. Candidates whose file is ready can travel sooner after an offer, and employers can see it.'}
            </p>
          </div>

          <section aria-labelledby="readiness" className="rounded-[20px] border border-line bg-surface p-[clamp(18px,2.4cqi,26px)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="readiness" className="m-0 text-[19px] font-semibold">Visa file</h2>
                <p className="mt-1 mb-0 text-[14px] text-ink-2">
                  {readiness.ready
                    ? 'Complete and checked. You are ready to travel once the visa is issued.'
                    : readiness.missing.length
                      ? `Still needed: ${readiness.missing.slice(0, 4).map((k) => DOCUMENT_LABELS[k].toLowerCase()).join(', ')}${readiness.missing.length > 4 ? ' and more' : ''}.`
                      : 'Waiting for our checks.'}
                </p>
              </div>
              <p className="m-0 font-mono text-[32px] font-semibold leading-none">
                {readiness.score}
                <span className="text-[15px] font-normal text-muted">/100</span>
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-canvas" role="progressbar" aria-valuenow={readiness.score} aria-valuemin={0} aria-valuemax={100} aria-label="Visa file completeness">
              <div className="h-full rounded-full bg-accent" style={{ width: `${readiness.score}%` }} />
            </div>
            {readiness.expiringSoon.length > 0 && (
              <p className="mt-3 mb-0 text-[14px] text-accent-deep">
                Expiring soon: {readiness.expiringSoon.map((k) => DOCUMENT_LABELS[k].toLowerCase()).join(', ')}. Upload a new one before it runs out.
              </p>
            )}
            <DocumentVault documents={data.documents} />
          </section>

          {data.plan ? (
            <section aria-labelledby="steps">
              <h2 id="steps" className="m-0 text-[22px] font-semibold tracking-[-0.02em]">Your steps</h2>
              <MilestoneList milestones={data.plan.milestones} />
            </section>
          ) : (
            <section aria-labelledby="path">
              <h2 id="path" className="m-0 text-[22px] font-semibold tracking-[-0.02em]">What happens after an offer</h2>
              <p className="mt-2 mb-0 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
                When you accept an offer, your recruiter turns this into your own plan with dates. The documents next to each step are the ones it needs.
              </p>
              <ol className="m-0 mt-5 flex list-none flex-col gap-3 p-0">
                {MILESTONE_TEMPLATE.filter((m) => !m.arrival).slice(0, 5).map((m, i) => (
                  <li key={m.key} className="rounded-[14px] border border-line bg-paper px-4 py-3">
                    <p className="m-0 text-[15px] font-medium"><span className="font-mono text-muted">{String(i + 1).padStart(2, '0')}</span> {m.label}</p>
                    <p className="mt-1 mb-0 text-[14px] text-ink-2">{m.candidateText}</p>
                    {m.documents && (
                      <p className="mt-2 mb-0 flex flex-wrap gap-1.5 text-[13px]">
                        {m.documents.map((kind) => (
                          <span key={kind} className={`rounded-full px-2.5 py-0.5 ${readiness.verified.includes(kind) ? 'bg-success/15 text-[oklch(0.42_0.12_150)]' : 'bg-canvas text-muted'}`}>
                            {readiness.verified.includes(kind) ? '✓ ' : ''}{DOCUMENT_LABELS[kind]}
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {data.plan && <FamilyLinks links={data.familyLinks} />}
          {data.placed && <StoryForm story={data.story} />}
        </div>
      </main>
    </>
  );
}
