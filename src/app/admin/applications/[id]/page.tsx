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
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Application' };

const YEARS = ['Under 1 year', '1 to 3 years', '3 to 5 years', 'More than 5 years'];

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requirePermission('applications.view', `/admin/applications/${id}`);
  const app = await getApplicationForConsole(id);
  if (!app) notFound();
  const meta = STATUS_META[app.status];

  return (
    <AdminShell current="/admin/applications" isStaff>
      <Link href="/admin/applications" className="font-mono text-[12px] text-muted no-underline hover:text-ink">← All applications</Link>
      <div className="mt-4">
        <AdminHeading
          title={app.candidate.fullName}
          lead={`${app.job.title}, ${app.job.city} · ${app.reference}`}
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
                ['Assessment', app.candidate.paymentStatus === 'paid' ? 'Completed and paid' : 'Not completed'],
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
              <Link href="/admin/cvs" className="prose-link mt-4 inline-block text-[14px]">Open the CV queue</Link>
            )}
          </section>

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
                    </li>
                  );
                })}
              </ul>
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

        <aside className="xl:sticky xl:top-20 xl:self-start">
          {can(access, 'applications.manage') ? (
            <div className="flex flex-col gap-4">
              <ApplicationActions id={app.id} status={app.status} rating={app.rating} />
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
