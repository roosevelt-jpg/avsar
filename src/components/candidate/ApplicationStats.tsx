import type { CandidateApplication } from '@/lib/applications/data';
import { STATUS_META } from '@/lib/applications/status';

/**
 * A candidate's own numbers, at a glance: how many jobs they applied to, how
 * many are still moving, and how far the best one has got. Counts only; the
 * tracker below explains each application.
 */
export function ApplicationStats({ applications }: { applications: CandidateApplication[] }) {
  const active = applications.filter((a) => STATUS_META[a.status].tone !== 'stopped');
  const interviews = applications.filter((a) => a.status === 'interview').length;
  const offers = applications.filter((a) => ['offer', 'hired', 'visa_processing', 'relocated'].includes(a.status)).length;
  const lastMove = applications.reduce<string | null>((latest, a) => (!latest || a.statusChangedAt > latest ? a.statusChangedAt : latest), null);

  const cards = [
    { label: 'Applied', value: applications.length, note: 'jobs in total' },
    { label: 'In progress', value: active.length, note: 'still being considered' },
    { label: 'Interviews', value: interviews, note: interviews ? 'check your email for times' : 'none scheduled yet' },
    { label: 'Offers', value: offers, note: offers ? 'congratulations' : 'none yet' },
  ];

  return (
    <div>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4">
        {cards.map((card, i) => (
          <li key={card.label} className={`rounded-[18px] border p-4 ${i === 0 ? 'border-ink bg-ink text-paper' : 'border-line bg-surface'}`}>
            <p className={`m-0 text-[13px] ${i === 0 ? 'text-dark-muted-2' : 'text-ink-2'}`}>{card.label}</p>
            <p className="m-0 mt-2 text-[30px] font-semibold leading-none tracking-[-0.03em]">{card.value}</p>
            <p className={`m-0 mt-2 text-[12px] ${i === 0 ? 'text-dark-muted' : 'text-muted'}`}>{card.note}</p>
          </li>
        ))}
      </ul>
      {lastMove && (
        <p className="m-0 mt-3 text-[13px] text-muted">
          Last update on your applications: {new Date(lastMove).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}
