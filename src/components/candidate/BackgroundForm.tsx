'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { BackgroundInput, CandidateBackground } from '@/lib/candidate/background';

const FIELD = 'w-full rounded-[12px] border border-line-strong bg-paper px-3.5 py-2.5 text-[16px]';

type YesNo = { key: 'visaRefused' | 'workedAbroad' | 'overstayOrRemoval'; detailKey: 'visaRefusalDetail' | 'workedAbroadDetail' | 'overstayDetail'; label: string; detailLabel: string };

const QUESTIONS: YesNo[] = [
  { key: 'visaRefused', detailKey: 'visaRefusalDetail', label: 'Has any country ever refused you a visa?', detailLabel: 'Which country, which year, and the reason given' },
  { key: 'workedAbroad', detailKey: 'workedAbroadDetail', label: 'Have you worked outside India before?', detailLabel: 'Which countries, which jobs, and for how long' },
  { key: 'overstayOrRemoval', detailKey: 'overstayDetail', label: 'Have you ever stayed in a country longer than your visa allowed, or been sent back from one?', detailLabel: 'Which country, which year, and what happened' },
];

/**
 * The background questions, on the candidate's dashboard.
 *
 * Every answer is optional and "not answered" is its own state, so leaving a
 * question blank never reads as "no". A truthful "yes" is what lets the
 * lawyers plan around a refusal before it becomes a second one, and the copy
 * says so.
 */
export function BackgroundForm({ initial }: { initial: CandidateBackground }) {
  const router = useRouter();
  const [form, setForm] = useState<BackgroundInput>({
    visaRefused: initial.visaRefused,
    visaRefusalDetail: initial.visaRefusalDetail,
    workedAbroad: initial.workedAbroad,
    workedAbroadDetail: initial.workedAbroadDetail,
    overstayOrRemoval: initial.overstayOrRemoval,
    overstayDetail: initial.overstayDetail,
    dependants: initial.dependants,
    dependantsDetail: initial.dependantsDetail,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/candidate/background', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setMessage('Saved.');
        router.refresh();
      } else {
        setMessage('Your answers could not be saved. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex max-w-[620px] flex-col gap-5">
      {QUESTIONS.map((q) => {
        const value = form[q.key];
        return (
          <fieldset key={q.key} className="m-0 border-0 p-0">
            <legend className="mb-2 text-[15px] font-medium leading-[1.45]">{q.label}</legend>
            <div className="flex gap-2">
              {([true, false] as const).map((option) => (
                <button
                  key={String(option)}
                  type="button"
                  aria-pressed={value === option}
                  onClick={() => setForm({ ...form, [q.key]: value === option ? null : option })}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-[14px] ${value === option ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-paper text-ink'}`}
                >
                  {option ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
            {value === true && (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[14px] text-ink-2">{q.detailLabel}</span>
                <textarea
                  value={form[q.detailKey]}
                  onChange={(e) => setForm({ ...form, [q.detailKey]: e.target.value })}
                  maxLength={500}
                  rows={3}
                  className={FIELD}
                />
              </label>
            )}
          </fieldset>
        );
      })}

      <label className="block">
        <span className="mb-1.5 block text-[15px] font-medium leading-[1.45]">
          How many family members would you want to bring to Portugal later?
        </span>
        <select
          value={form.dependants ?? ''}
          onChange={(e) => setForm({ ...form, dependants: e.target.value === '' ? null : Number(e.target.value) })}
          className={`${FIELD} max-w-[200px]`}
        >
          <option value="">Not answered</option>
          {Array.from({ length: 11 }, (_, n) => (
            <option key={n} value={n}>{n === 10 ? '10 or more' : n}</option>
          ))}
        </select>
      </label>
      {(form.dependants ?? 0) > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-[14px] text-ink-2">Who (for example: wife, two children aged 4 and 7)</span>
          <input value={form.dependantsDetail} onChange={(e) => setForm({ ...form, dependantsDetail: e.target.value })} maxLength={500} className={FIELD} />
        </label>
      )}

      <div>
        <button type="button" disabled={busy} onClick={() => void save()} className="cursor-pointer rounded-full border-0 bg-ink px-5 py-2.5 text-[14px] text-paper disabled:opacity-40">
          Save answers
        </button>
      </div>
      {message && <p role="status" className="m-0 text-[14px] text-ink-2">{message}</p>}
    </div>
  );
}
