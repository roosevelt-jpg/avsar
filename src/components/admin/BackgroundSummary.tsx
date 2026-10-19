import { backgroundFlags, type CandidateBackground } from '@/lib/candidate/background';

function answer(value: boolean | null, detail: string): string {
  if (value === null) return 'Not answered';
  if (!value) return 'No';
  return detail ? `Yes: ${detail}` : 'Yes (no detail given)';
}

/** The candidate's own background answers, for staff. Never shown to employers. */
export function BackgroundSummary({ background }: { background: CandidateBackground | null }) {
  const flags = background ? backgroundFlags(background) : [];
  return (
    <section className="rounded-[16px] border border-line bg-surface p-4 text-[13px]">
      <h2 className="m-0 text-[15px] font-semibold">Background</h2>
      {!background ? (
        <p className="m-0 mt-2 text-ink-2">Not answered yet. The questions are on the candidate&rsquo;s dashboard.</p>
      ) : (
        <>
          {flags.length > 0 && (
            <p className="m-0 mt-2 font-medium text-accent-deep">For the lawyers: {flags.join(', ')}.</p>
          )}
          <dl className="m-0 mt-2 flex flex-col gap-1.5 text-ink-2">
            {[
              ['Visa refused before', answer(background.visaRefused, background.visaRefusalDetail)],
              ['Worked abroad', answer(background.workedAbroad, background.workedAbroadDetail)],
              ['Overstay or removal', answer(background.overstayOrRemoval, background.overstayDetail)],
              [
                'Family to follow',
                background.dependants === null
                  ? 'Not answered'
                  : `${background.dependants}${background.dependantsDetail ? `: ${background.dependantsDetail}` : ''}`,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="inline font-medium text-ink">{label}: </dt>
                <dd className="m-0 inline">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
