import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import { fill, type Dictionary, type Locale, localePath } from '@/lib/i18n';
import type { CandidateStatus } from '@/lib/candidate/status';

/**
 * Where the candidate actually is.
 *
 * Replaces a fixed timeline from the prototype that told everyone their
 * assessment was completed on 5 October, including people who had not started.
 * Every state here is derived from the database.
 */
export function JourneyStatus({
  locale,
  t,
  status,
}: {
  locale: Locale;
  t: Dictionary;
  status: CandidateStatus;
}) {
  const s = t.status;

  const labels: Record<string, string> = {
    registered: s.registered,
    profile: s.profile,
    assessment: s.assessment,
    payment: s.payment,
    report: s.report,
    selection: s.selection,
  };

  /*
    The one thing to do next, rather than a list of everything outstanding.
    Paying no longer gates the first two steps, so the chain starts at the
    profile for everybody. When the fee is what is outstanding this stays null:
    the unlock panel below the timeline makes that ask, and two calls to action
    for the same thing is one too many.
  */
  const action =
    !status.profileComplete && !status.cvUploaded
      ? { href: localePath(locale, '/profile'), label: s.completeProfile }
      : !status.assessmentComplete
        ? {
            href: localePath(locale, '/assessment'),
            label: status.sectionsDone.length > 0 ? s.continueAssessment : s.startAssessment,
          }
        : null;

  return (
    <section>
      <h2 className="m-0 mb-5 text-[21px] font-semibold">{s.title}</h2>

      <ol className="m-0 flex list-none flex-col p-0">
        {status.steps.map((step, index) => {
          const last = index === status.steps.length - 1;
          const isAssessment = step.key === 'assessment';
          return (
            <li key={step.key} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden
                  className="mt-1.5 size-[11px] shrink-0 rounded-full border-2"
                  style={{
                    background:
                      step.state === 'todo'
                        ? '#fff'
                        : step.state === 'current'
                          ? 'oklch(0.56 0.14 40)'
                          : '#1b1a17',
                    borderColor:
                      step.state === 'todo'
                        ? '#d9d4c8'
                        : step.state === 'current'
                          ? 'oklch(0.56 0.14 40)'
                          : '#1b1a17',
                  }}
                />
                {!last && <span aria-hidden className="w-px flex-1 bg-line" />}
              </div>

              <div className={`pb-6 ${step.state === 'todo' ? 'text-muted' : 'text-ink'}`}>
                <p className="m-0 text-[15px] font-medium">{labels[step.key]}</p>
                <Mono className="text-muted">
                  {isAssessment && !status.assessmentComplete
                    ? fill(s.sectionsProgress, {
                        done: status.sectionsDone.length,
                        total: status.sectionsTotal,
                      })
                    : step.state === 'done'
                      ? s.done
                      : step.state === 'current'
                        ? s.current
                        : s.todo}
                </Mono>
              </div>
            </li>
          );
        })}
      </ol>

      {action && (
        <Link
          href={action.href}
          className="t-colors inline-block rounded-[12px] bg-ink px-5 py-3 text-[15px] font-medium text-white no-underline hover:bg-accent"
        >
          {action.label} →
        </Link>
      )}
    </section>
  );
}
