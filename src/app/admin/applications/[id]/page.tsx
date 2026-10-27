import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { ApplicationActions } from '@/components/admin/ApplicationActions';
import { InterviewForm } from '@/components/admin/InterviewForm';
import { isPast } from '@/lib/clock';
import { INTERVIEW_MODE_LABELS, interviewTimes } from '@/lib/interviews/time';
import { Mono } from '@/components/ui/Mono';
import { getApplicationForConsole } from '@/lib/applications/data';
import { STATUS_META } from '@/lib/applications/status';
import { positionLabel } from '@/lib/data/positions';
import { getSiteSettings } from '@/lib/cms/data';
import { meetsShortlistScore } from '@/lib/company/config';
import { can, requirePermission } from '@/lib/rbac/server';
import { logDataAccess } from '@/lib/privacy/log';
import { MilestoneEditor, StartPlan } from '@/components/admin/RelocationActions';
import { ScorecardForm } from '@/components/admin/HiringActions';
import { applicationHiring, FEE_STATUS_LABELS } from '@/lib/hiring/data';
import { averageScore, RECOMMENDATION_LABELS } from '@/lib/hiring/scorecard';
import { applicationRelocation } from '@/lib/relocation/data';
import { backgroundFor } from '@/lib/candidate/background';
import { BackgroundSummary } from '@/components/admin/BackgroundSummary';
import { computeReadiness, DOCUMENT_LABELS } from '@/lib/relocation/documents';
import { milestoneTemplate, progress } from '@/lib/relocation/milestones';
import { replyClock } from '@/lib/console/workdays';
import { attachLeads, findSamePerson } from '@/lib/console/same-person';
import { SamePerson } from '@/components/admin/SamePerson';

export const metadata = { title: 'Application' };

const YEARS = ['Under 1 year', '1 to 3 years', '3 to 5 years', 'More than 5 years'];

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requirePermission('applications.view', `/admin/applications/${id}`);
  const app = await getApplicationForConsole(id);
  if (!app) notFound();
  await logDataAccess(access.userId, app.candidate.id, 'application.view', { application: app.id });
  const meta = STATUS_META[app.status];
  const [hiring, relocation, background, { hiring: rules }] = await Promise.all([
    applicationHiring(app.id),
    applicationRelocation(app.id, app.candidate.id),
    backgroundFor(app.candidate.id),
    getSiteSettings(),
  ]);
  const readiness = computeReadiness(relocation.documents);
  const canManage = can(access, 'applications.manage');
  if (can(access, 'leads.manage')) {
    await attachLeads({
      candidateId: app.candidate.id,
      email: app.candidate.email,
      phone: app.candidate.phone,
      actor: access.userId,
    });
  }
  const person = await findSamePerson({
    candidateId: app.candidate.id,
    email: app.candidate.email,
    phone: app.candidate.phone,
    excludeApplicationId: app.id,
  });
  const clock = app.status === 'submitted' ? replyClock(app.createdAt, rules.responseDays) : null;
  const canRelocate = can(access, 'relocation.manage');
  const plannable = ['offer', 'hired', 'visa_processing', 'relocated'].includes(app.status);

  return (
    <AdminShell current="/admin/applications" isStaff>
      <Link href="/admin/applications" className="font-mono text-[12px] text-muted no-underline hover:text-ink">← All applications</Link>
      <div className="mt-4">
        <AdminHeading
          title={app.candidate.fullName}
          lead={`${app.job.title}, ${app.job.city} · ${app.reference}${clock ? ` · day ${clock.elapsed} of ${clock.limit}${clock.overdue ? ' · reply is late' : clock.dueSoon ? ' · reply due soon' : ''}` : ''}${app.nextStep ? ` · next: ${app.nextStep}${app.nextStepOn ? ` (${app.nextStepOn})` : ''}` : ''}`}
          actions={<Pill tone={meta.tone === 'success' ? 'success' : meta.tone === 'stopped' ? 'muted' : 'accent'}>{meta.label}</Pill>}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <section className="rounded-[16px] border border-line bg-surface p-5">
            <h2 className="m-0 text-[16px] font-semibold">Candidate</h2>
            <dl className="m-0 mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-[14px] sm:grid-cols-2">
              {[
                ['Email', <a key="e" href={`mailto:${app.candidate.email}`}>{app.candidate.email}</a>],
                ['Mobile / WhatsApp', <a key="p" href={`https://wa.me/${app.candidate.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer" dir="ltr">{app.candidate.phone}</a>],
                ['From', app.candidate.cityState ?? '-'],
                ['Role', app.candidate.position ? positionLabel(app.candidate.position) : '-'],
                ['Experience', app.candidateExtra.yearsBand != null ? YEARS[app.candidateExtra.yearsBand] : '-'],
                ['Passport', app.candidateExtra.hasPassport ? 'Yes' : 'Not yet'],
                ['Both reports', app.candidate.paymentStatus === 'paid' ? 'Owned' : 'Not both'],
                ['Visible to employers', app.candidateExtra.visible ? 'Yes' : 'No (hidden by candidate)'],
                ['WhatsApp updates', app.candidateExtra.whatsappOptIn ? 'Opted in' : 'Not opted in'],
                [
                  'CV',
                  app.cvDocumentId && can(access, 'candidates.view') ? (
                    <a key="cv" href={`/api/admin/applications/${app.id}/cv`} className="prose-link">Download the CV</a>
                  ) : app.cvDocumentId ? (
                    'Attached (your role cannot download it)'
                  ) : (
                    'None attached'
                  ),
                ],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt><Mono className="text-muted">{String(label).toUpperCase()}</Mono></dt>
                  <dd className="m-0 mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
            {can(access, 'cv.review') && (
              <Link href="/admin/cv-queue" className="prose-link mt-4 inline-block text-[14px]">Open the CV queue</Link>
            )}
          </section>

          <SamePerson person={person} />

          {(app.screeningQuestions.length > 0 || app.coverNote) && (
            <section className="rounded-[16px] border border-line bg-surface p-5">
              <h2 className="m-0 text-[16px] font-semibold">Answers</h2>
              <dl className="m-0 mt-4 flex flex-col gap-3 text-[14px]">
                {app.screeningQuestions.map((q) => (
                  <div key={q.id}>
                    <dt className="text-ink-2">{q.label}</dt>
                    <dd className="m-0 mt-0.5 font-medium capitalize">{String(app.answers[q.id] ?? '-')}</dd>
                  </div>
                ))}
                {app.coverNote && (
                  <div>
                    <dt className="text-ink-2">Note from the candidate</dt>
                    <dd className="m-0 mt-0.5 whitespace-pre-line">{app.coverNote}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {app.interviews.length > 0 && (
            <section className="rounded-[16px] border border-line bg-surface p-5">
              <h2 className="m-0 text-[16px] font-semibold">Interviews</h2>
              <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
                {app.interviews.map((interview) => {
                  const times = interviewTimes(interview.startsAt);
                  const past = isPast(interview.startsAt);
                  return (
                    <li key={interview.id} className="rounded-[12px] bg-paper px-4 py-3 text-[14px]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{times.india}</span>
                        <Pill tone={interview.status === 'cancelled' ? 'muted' : past ? 'neutral' : 'accent'}>
                          {interview.status === 'cancelled' ? 'cancelled' : past ? 'past' : 'upcoming'}
                        </Pill>
                      </div>
                      <p className="m-0 mt-0.5 text-ink-2">
                        {times.lisbon} · {INTERVIEW_MODE_LABELS[interview.mode]} · {interview.durationMinutes} min
                      </p>
                      {interview.link && (
                        <a href={interview.link} target="_blank" rel="noreferrer" className="prose-link mt-1 inline-block break-all">{interview.link}</a>
                      )}
                      {interview.location && <p className="m-0 mt-1 text-ink-2">{interview.location}</p>}
                      {interview.candidateMessage && <p className="m-0 mt-1 text-ink-2">“{interview.candidateMessage}”</p>}
                      {hiring.scorecards
                        .filter((card) => card.interviewId === interview.id)
                        .map((card) => (
                          <div key={card.id} className="mt-3 rounded-[10px] border border-line-soft bg-surface px-3 py-2">
                            <p className="m-0 flex flex-wrap items-center gap-2">
                              <Pill tone={card.recommendation === 'advance' ? 'success' : card.recommendation === 'reject' ? 'muted' : 'accent'}>{RECOMMENDATION_LABELS[card.recommendation]}</Pill>
                              <span className="text-muted">{card.authorKind === 'employer' ? 'Employer' : 'Recruiter'} · average {averageScore(card.criteria) ?? '-'} / 5</span>
                            </p>
                            <p className="m-0 mt-1 text-[13px] text-ink-2">{card.criteria.map((c) => `${c.label} ${c.score}`).join(' · ')}</p>
                            {card.summary && <p className="m-0 mt-1 text-ink-2">{card.summary}</p>}
                          </div>
                        ))}
                      {canManage && past && interview.status !== 'cancelled' && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-[13px]">Add your scorecard</summary>
                          <div className="mt-2">
                            <ScorecardForm endpoint={`/api/admin/applications/${app.id}/scorecards`} extra={{ interviewId: interview.id }} />
                          </div>
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {(plannable || relocation.documents.length > 0) && (
            <section className="rounded-[16px] border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="m-0 text-[16px] font-semibold">Relocation</h2>
                <span className="text-[14px] text-ink-2">
                  Visa file {readiness.score}/100{readiness.ready ? ', ready' : ''}
                  {relocation.milestones.length > 0 && ` · ${progress(relocation.milestones).done} of ${relocation.milestones.length} steps done`}
                </span>
              </div>
              <p className="m-0 mt-2 flex flex-wrap gap-1.5 text-[12px]">
                {readiness.verified.map((k) => <Pill key={k} tone="success">{DOCUMENT_LABELS[k]}</Pill>)}
                {readiness.awaitingReview.map((k) => <Pill key={k} tone="accent">{DOCUMENT_LABELS[k]}: to check</Pill>)}
                {readiness.missing.map((k) => <Pill key={k} tone="muted">{DOCUMENT_LABELS[k]}: missing</Pill>)}
              </p>
              {canRelocate && readiness.awaitingReview.length > 0 && (
                <Link href="/admin/relocation" className="prose-link mt-2 inline-block text-[14px]">Check documents in the relocation queue</Link>
              )}
              {relocation.milestones.length > 0 ? (
                <ol className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
                  {relocation.milestones.map((m) => (
                    <li key={m.id} className="rounded-[12px] bg-paper px-4 py-3 text-[14px]">
                      <p className="m-0 mb-2 font-medium">{milestoneTemplate(m.key)?.label ?? m.key}</p>
                      {canRelocate ? (
                        <MilestoneEditor milestone={m} />
                      ) : (
                        <p className="m-0 text-ink-2">{m.status}{m.dueOn ? ` · ${m.dueOn}` : ''}{m.blocker ? ` · ${m.blocker}` : ''}</p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : plannable && canRelocate ? (
                <div className="mt-4">
                  <StartPlan applicationId={app.id} />
                </div>
              ) : null}
            </section>
          )}

          <section className="rounded-[16px] border border-line bg-surface p-5">
            <h2 className="m-0 text-[16px] font-semibold">History</h2>
            <ol className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
              {[...app.events].reverse().map((event) => (
                <li key={event.id} className="rounded-[12px] bg-paper px-4 py-3 text-[14px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {event.toStatus ? `${event.fromStatus ? `${STATUS_META[event.fromStatus].label} → ` : ''}${STATUS_META[event.toStatus].label}` : 'Note'}
                    </span>
                    <span className="flex items-center gap-2">
                      {!event.visibleToCandidate && <Pill tone="muted">internal</Pill>}
                      <Mono className="text-muted">{new Date(event.createdAt).toLocaleString('en-GB')}</Mono>
                    </span>
                  </div>
                  {event.note && <p className="m-0 mt-1 whitespace-pre-line text-ink-2">{event.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-[16px] border border-line bg-surface p-4">
            <h2 className="m-0 flex items-baseline justify-between text-[15px] font-semibold">
              Assessment score
              <span className="font-mono text-[22px]">
                {hiring.assessmentScore ?? '–'}
                <span className="text-[13px] font-normal text-muted">/100</span>
              </span>
            </h2>
            <p className="m-0 mt-2 text-[13px] text-ink-2">
              {hiring.assessmentScore === null
                ? 'Assessment not finished yet.'
                : meetsShortlistScore(rules, hiring.assessmentScore)
                  ? `Above ${rules.shortlistMinScore / 10} out of 10: qualifies for the shortlist if the role's essential requirements are met.`
                  : `Not above ${rules.shortlistMinScore / 10} out of 10: below the shortlist score.`}
            </p>
            <p className="m-0 mt-2 text-[12px] text-muted">Whether the candidate paid for the package plays no part in shortlisting.</p>
          </section>
          <BackgroundSummary background={background} />
          <section className="rounded-[16px] border border-line bg-surface p-4">
            <h2 className="m-0 flex items-baseline justify-between text-[15px] font-semibold">
              Fit for this job
              <span className="font-mono text-[22px]">{hiring.match.score}<span className="text-[13px] font-normal text-muted">/100</span></span>
            </h2>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0 text-[13px] text-ink-2">
              {hiring.match.parts.map((p) => (
                <li key={p.label}><span className="font-medium text-ink">{p.label} {p.points}/{p.max}</span>: {p.reason}</li>
              ))}
            </ul>
            <p className="m-0 mt-3 text-[12px] text-muted">A guide to reading order, not a decision.</p>
          </section>
          {hiring.fee && (
            <section className="rounded-[16px] border border-line bg-surface p-4 text-[14px]">
              <h2 className="m-0 text-[15px] font-semibold">Employer fee</h2>
              <p className="m-0 mt-2">
                €{(hiring.fee.amountMinor / 100).toLocaleString('en-IE')} · {FEE_STATUS_LABELS[hiring.fee.status]}
                {hiring.fee.invoiceRef ? ` · ${hiring.fee.invoiceRef}` : ''}
              </p>
              {can(access, 'payments.view') && <Link href="/admin/fees" className="prose-link mt-1 inline-block text-[13px]">All fees</Link>}
            </section>
          )}
          {canManage ? (
            <div className="flex flex-col gap-4">
              <ApplicationActions
                id={app.id}
                status={app.status}
                rating={app.rating}
                assignedToMe={app.assignedTo === access.userId}
                hasOwner={Boolean(app.assignedTo)}
                nextStep={app.nextStep}
                nextStepOn={app.nextStepOn}
              />
              <InterviewForm applicationId={app.id} />
            </div>
          ) : (
            <p className="rounded-[16px] border border-line bg-surface p-4 text-[14px] text-ink-2">Your role can view applications but not move them.</p>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
