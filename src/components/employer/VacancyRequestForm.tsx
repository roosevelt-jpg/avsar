'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CEFR_LEVELS, EMPLOYMENT_LABELS, EMPLOYMENT_TYPES, HOUSING_LABELS, HOUSING_OPTIONS } from '@/lib/jobs/types';

const field =
  't-colors w-full rounded-[10px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-ink';

/** Blank stays null, so "no salary given" is never sent as zero. */
function intOrNull(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * The employer's side of a vacancy: the facts a recruiter needs to write the
 * posting. The recruiter writes the candidate-facing text, so there is no
 * description field here, only a note for anything that does not fit.
 */
export function VacancyRequestForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [employmentType, setEmploymentType] = useState<(typeof EMPLOYMENT_TYPES)[number]>('full_time');
  const [contractMonths, setContractMonths] = useState('');
  const [openings, setOpenings] = useState('1');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState<'hour' | 'month' | 'year'>('month');
  const [housing, setHousing] = useState<(typeof HOUSING_OPTIONS)[number]>('assisted');
  const [mealsIncluded, setMealsIncluded] = useState(false);
  const [minEnglish, setMinEnglish] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  const min = intOrNull(salaryMin);
  const max = intOrNull(salaryMax);
  const rangeWrong = min != null && max != null && max < min;
  const ready = title.trim().length >= 3 && city.trim().length >= 2 && (intOrNull(openings) ?? 0) >= 1 && !rangeWrong;

  async function submit() {
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      const response = await fetch('/api/employer/vacancies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          city,
          region,
          employmentType,
          contractMonths: intOrNull(contractMonths),
          openings: intOrNull(openings) ?? 1,
          salaryMinEur: min,
          salaryMaxEur: max,
          salaryPeriod,
          housing,
          mealsIncluded,
          minEnglish: minEnglish || null,
          note,
        }),
      });
      const data = (await response.json().catch(() => null)) as { status?: string; error?: string } | null;

      if (data?.error === 'not_configured') {
        setFailed(true);
        setMessage('This is a preview: nothing is saved until the platform is connected to its database.');
        return;
      }
      if (data?.error === 'rate_limited') {
        setFailed(true);
        setMessage('That is a lot of requests in a short time. Please wait a few minutes and try again.');
        return;
      }
      if (!response.ok || data?.status !== 'created') {
        setFailed(true);
        setMessage('The request could not be sent. Check the fields and try again.');
        return;
      }

      setMessage('Sent. A recruiter will prepare the posting and confirm the details with you before it goes live.');
      setTitle('');
      setOpenings('1');
      setSalaryMin('');
      setSalaryMax('');
      setNote('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 max-w-[760px] rounded-[14px] border border-line bg-surface-subtle p-5">
      <p className="m-0 mb-4 text-[15px] font-semibold">Request a vacancy</p>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[14px]">Role</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Line cook" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">City</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} placeholder="Albufeira" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Region (optional)</span>
          <input value={region} onChange={(e) => setRegion(e.target.value)} maxLength={80} placeholder="Algarve" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Contract</span>
          <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as typeof employmentType)} className={field}>
            {EMPLOYMENT_TYPES.map((value) => (
              <option key={value} value={value}>{EMPLOYMENT_LABELS[value]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Contract length in months (optional)</span>
          <input value={contractMonths} onChange={(e) => setContractMonths(e.target.value)} inputMode="numeric" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">People needed</span>
          <input value={openings} onChange={(e) => setOpenings(e.target.value)} inputMode="numeric" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Minimum English (optional)</span>
          <select value={minEnglish} onChange={(e) => setMinEnglish(e.target.value)} className={field}>
            <option value="">No minimum</option>
            {CEFR_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Gross salary from, € (optional)</span>
          <input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} inputMode="numeric" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Gross salary to, € (optional)</span>
          <input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} inputMode="numeric" className={field} aria-invalid={rangeWrong} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Salary per</span>
          <select value={salaryPeriod} onChange={(e) => setSalaryPeriod(e.target.value as typeof salaryPeriod)} className={field}>
            <option value="hour">Hour</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[14px]">Housing</span>
          <select value={housing} onChange={(e) => setHousing(e.target.value as typeof housing)} className={field}>
            {HOUSING_OPTIONS.map((value) => (
              <option key={value} value={value}>{HOUSING_LABELS[value]}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2.5 sm:col-span-2">
          <input type="checkbox" checked={mealsIncluded} onChange={(e) => setMealsIncluded(e.target.checked)} className="size-4" />
          <span className="text-[14px]">Meals included</span>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[14px]">Anything else (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Shifts, start date, skills you need, whether candidates may name you before interview."
            className={field}
          />
        </label>
      </div>

      {rangeWrong && <p className="mt-3 mb-0 text-[14px] text-accent-deep">The upper salary is below the lower one.</p>}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || !ready}
        className="t-colors mt-4 cursor-pointer rounded-[10px] border-0 bg-ink px-4 py-2.5 text-[14px] font-medium text-paper hover:bg-ink-hover disabled:opacity-40"
      >
        Send request
      </button>

      {message && (
        <p role="status" className={`mt-3 mb-0 text-[14px] ${failed ? 'text-accent-deep' : 'text-ink-2'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
