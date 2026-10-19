'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { PlacePicker } from '@/components/candidate/PlacePicker';
import { DEFAULT_COUNTRY } from '@/lib/data/dial-codes';
import type { Dictionary } from '@/lib/i18n';
import type { ProfileInput } from '@/lib/validation-profile';

type Experience = ProfileInput['experiences'][number];
type Education = ProfileInput['education'][number];
type Language = ProfileInput['languages'][number];

const AVAILABILITY = ['immediate', 'one_month', 'three_months', 'six_months'] as const;
const LEVELS = ['Basic', 'Conversational', 'Fluent', 'Native'] as const;

const EMPTY_EXPERIENCE: Experience = {
  employer: '',
  title: '',
  location: '',
  startMonth: '',
  endMonth: '',
  isCurrent: false,
  description: '',
};

const EMPTY_EDUCATION: Education = { institution: '', qualification: '', field: '' };

/**
 * Manual profile entry.
 *
 * Field set follows what applicant tracking systems ask for, minus the parts
 * that do not apply here. There is no salary expectation box: an exact figure
 * anchors a negotiation the candidate is not in a position to have yet, across
 * two currencies and a cost of living they have never seen.
 *
 * The whole list is sent on save rather than diffed, because the rows have no
 * stable identity in the browser and a partial update on a list someone has
 * just reordered loses work.
 */
export function ProfileForm({
  t,
  initial,
  initialCityState = '',
}: {
  t: Dictionary;
  initial: ProfileInput;
  /** Current candidates.city_state from the server. */
  initialCityState?: string;
}) {
  const p = t.profile;
  const router = useRouter();

  const [headline, setHeadline] = useState(initial.headline ?? '');
  const [summary, setSummary] = useState(initial.summary ?? '');
  const [linkedinUrl, setLinkedin] = useState(initial.linkedinUrl ?? '');
  const [cityState, setCityState] = useState(initialCityState);
  const [placeCountry, setPlaceCountry] = useState(DEFAULT_COUNTRY);
  const [skills, setSkills] = useState(initial.skills.join(', '));
  const [languages, setLanguages] = useState<Language[]>(
    initial.languages.length > 0 ? initial.languages : [{ language: 'English', level: 'Conversational' }],
  );
  const [availability, setAvailability] = useState<ProfileInput['availability']>(initial.availability);
  const [relocationReady, setRelocation] = useState(initial.relocationReady);
  const [experiences, setExperiences] = useState<Experience[]>(
    initial.experiences.length > 0 ? initial.experiences : [{ ...EMPTY_EXPERIENCE }],
  );
  const [education, setEducation] = useState<Education[]>(
    initial.education.length > 0 ? initial.education : [{ ...EMPTY_EDUCATION }],
  );

  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  function patchExperience(index: number, patch: Partial<Experience>) {
    setExperiences((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function patchEducation(index: number, patch: Partial<Education>) {
    setEducation((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save() {
    setState('saving');
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          headline,
          summary,
          linkedinUrl,
          cityState: cityState.trim() || undefined,
          skills: skills
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          languages: languages.filter((item) => item.language.trim()),
          availability,
          relocationReady,
          /* Rows the candidate started and abandoned are dropped rather than
             rejected: an empty row is not a validation error, it is a row they
             changed their mind about. */
          experiences: experiences.filter((row) => row.employer.trim() && row.title.trim()),
          education: education.filter((row) => row.institution.trim() && row.qualification.trim()),
        }),
      });

      if (!response.ok) throw new Error(String(response.status));
      setState('saved');
      router.refresh();
    } catch (error) {
      console.error('[profile] save failed', error);
      setState('error');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ------------------------------------------------------------ about */}
      <section className="rounded-[20px] border border-line bg-surface p-[clamp(20px,2.6cqi,28px)]">
        <h2 className="m-0 mb-5 text-[19px] font-semibold">{p.aboutTitle}</h2>

        <Field label={p.headline}>
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder={p.headlinePlaceholder}
            className={inputClass}
          />
        </Field>

        <Field label={p.summary} className="mt-4">
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <Field label={p.linkedin} className="mt-4">
          <input
            value={linkedinUrl}
            onChange={(event) => setLinkedin(event.target.value)}
            inputMode="url"
            className={inputClass}
          />
        </Field>

        <div className="mt-4">
          <PlacePicker
            value={cityState}
            onChange={setCityState}
            country={placeCountry}
            onCountryChange={setPlaceCountry}
            label={t.signup.cityState}
            countryLabel="Country"
            inputClassName={inputClass}
          />
        </div>
      </section>

      {/* ------------------------------------------------------- experience */}
      <section className="rounded-[20px] border border-line bg-surface p-[clamp(20px,2.6cqi,28px)]">
        <h2 className="m-0 mb-5 text-[19px] font-semibold">{p.experienceTitle}</h2>

        <div className="flex flex-col gap-5">
          {experiences.map((row, index) => (
            <div key={index} className="rounded-[16px] border border-line-soft p-4">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <Field label={p.employer}>
                  <input
                    value={row.employer}
                    onChange={(event) => patchExperience(index, { employer: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label={p.jobTitle}>
                  <input
                    value={row.title}
                    onChange={(event) => patchExperience(index, { title: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <div>
                  <PlacePicker
                    value={row.location ?? ''}
                    onChange={(next) => patchExperience(index, { location: next })}
                    country=""
                    label={p.jobLocation}
                    showCountry={false}
                    inputClassName={inputClass}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-4">
                <Field label={p.from}>
                  <input
                    type="month"
                    value={row.startMonth ?? ''}
                    onChange={(event) => patchExperience(index, { startMonth: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                {!row.isCurrent && (
                  <Field label={p.to}>
                    <input
                      type="month"
                      value={row.endMonth ?? ''}
                      onChange={(event) => patchExperience(index, { endMonth: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                )}
                <label className="flex cursor-pointer items-center gap-2.5 pb-3 text-[14px]">
                  <input
                    type="checkbox"
                    checked={row.isCurrent}
                    onChange={(event) => patchExperience(index, { isCurrent: event.target.checked })}
                  />
                  {p.current}
                </label>
              </div>

              <Field label={p.duties} className="mt-4">
                <textarea
                  value={row.description ?? ''}
                  onChange={(event) => patchExperience(index, { description: event.target.value })}
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
              </Field>

              {experiences.length > 1 && (
                <button
                  type="button"
                  onClick={() => setExperiences((rows) => rows.filter((_, i) => i !== index))}
                  className="t-colors mt-3 cursor-pointer border-0 bg-transparent p-0 text-[13px] text-muted hover:text-accent-deep"
                >
                  {p.remove}
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setExperiences((rows) => [...rows, { ...EMPTY_EXPERIENCE }])}
          className="t-colors mt-4 cursor-pointer rounded-[10px] border border-line-strong bg-surface px-3.5 py-2 text-[14px] hover:border-ink"
        >
          + {p.addExperience}
        </button>
      </section>

      {/* -------------------------------------------------------- education */}
      <section className="rounded-[20px] border border-line bg-surface p-[clamp(20px,2.6cqi,28px)]">
        <h2 className="m-0 mb-5 text-[19px] font-semibold">{p.educationTitle}</h2>

        <div className="flex flex-col gap-5">
          {education.map((row, index) => (
            <div key={index} className="rounded-[16px] border border-line-soft p-4">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                <Field label={p.institution}>
                  <input
                    value={row.institution}
                    onChange={(event) => patchEducation(index, { institution: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label={p.qualification}>
                  <input
                    value={row.qualification}
                    onChange={(event) => patchEducation(index, { qualification: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label={p.field}>
                  <input
                    value={row.field ?? ''}
                    onChange={(event) => patchEducation(index, { field: event.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label={p.endYear}>
                  <input
                    value={row.endYear ?? ''}
                    onChange={(event) =>
                      patchEducation(index, {
                        endYear: event.target.value ? Number(event.target.value) : undefined,
                      })
                    }
                    inputMode="numeric"
                    maxLength={4}
                    className={inputClass}
                  />
                </Field>
              </div>

              {education.length > 1 && (
                <button
                  type="button"
                  onClick={() => setEducation((rows) => rows.filter((_, i) => i !== index))}
                  className="t-colors mt-3 cursor-pointer border-0 bg-transparent p-0 text-[13px] text-muted hover:text-accent-deep"
                >
                  {p.remove}
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setEducation((rows) => [...rows, { ...EMPTY_EDUCATION }])}
          className="t-colors mt-4 cursor-pointer rounded-[10px] border border-line-strong bg-surface px-3.5 py-2 text-[14px] hover:border-ink"
        >
          + {p.addEducation}
        </button>
      </section>

      {/* --------------------------------------------- skills and languages */}
      <section className="rounded-[20px] border border-line bg-surface p-[clamp(20px,2.6cqi,28px)]">
        <h2 className="m-0 mb-5 text-[19px] font-semibold">{p.skillsTitle}</h2>
        <Field label={p.skillsTitle} hint={p.skillsHint}>
          <input
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            className={inputClass}
          />
        </Field>

        <h2 className="m-0 mt-7 mb-4 text-[19px] font-semibold">{p.languagesTitle}</h2>
        <div className="flex flex-col gap-3">
          {languages.map((row, index) => (
            <div key={index} className="flex flex-wrap items-end gap-3">
              <Field label={p.language}>
                <input
                  value={row.language}
                  onChange={(event) =>
                    setLanguages((rows) =>
                      rows.map((item, i) =>
                        i === index ? { ...item, language: event.target.value } : item,
                      ),
                    )
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={p.level}>
                <select
                  value={row.level}
                  onChange={(event) =>
                    setLanguages((rows) =>
                      rows.map((item, i) =>
                        i === index ? { ...item, level: event.target.value } : item,
                      ),
                    )
                  }
                  className={inputClass}
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </Field>
              {languages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLanguages((rows) => rows.filter((_, i) => i !== index))}
                  className="t-colors cursor-pointer border-0 bg-transparent pb-3 text-[13px] text-muted hover:text-accent-deep"
                >
                  {p.remove}
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLanguages((rows) => [...rows, { language: '', level: 'Basic' }])}
          className="t-colors mt-4 cursor-pointer rounded-[10px] border border-line-strong bg-surface px-3.5 py-2 text-[14px] hover:border-ink"
        >
          + {p.addLanguage}
        </button>
      </section>

      {/* ----------------------------------------------------- availability */}
      <section className="rounded-[20px] border border-line bg-surface p-[clamp(20px,2.6cqi,28px)]">
        <h2 className="m-0 mb-5 text-[19px] font-semibold">{p.readyTitle}</h2>

        <Field label={p.availability}>
          <select
            value={availability ?? ''}
            onChange={(event) =>
              setAvailability((event.target.value || undefined) as ProfileInput['availability'])
            }
            className={inputClass}
          >
            <option value="">-</option>
            {AVAILABILITY.map((value, index) => (
              <option key={value} value={value}>
                {p.availabilityOptions[index]}
              </option>
            ))}
          </select>
        </Field>

        <fieldset className="mt-5 m-0 border-0 p-0">
          <legend className="mb-2.5 p-0 text-[15px] font-medium">{p.relocation}</legend>
          <div className="flex gap-2">
            {[
              { label: p.relocationYes, value: true },
              { label: p.relocationNo, value: false },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={relocationReady === option.value}
                onClick={() => setRelocation(option.value)}
                className={`t-colors cursor-pointer rounded-full border px-[18px] py-2.5 text-[14px] ${
                  relocationReady === option.value
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line-strong bg-surface text-ink hover:border-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={state === 'saving'}
          className="t-colors cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-hover disabled:opacity-50"
        >
          {state === 'saving' ? p.saving : p.save}
        </button>
        <Mono aria-live="polite" className={state === 'error' ? 'text-accent-deep' : 'text-muted'}>
          {state === 'saved' ? p.saved : state === 'error' ? p.saveError : ''}
        </Mono>
      </div>
    </div>
  );
}

const inputClass =
  't-colors w-full rounded-[12px] border border-line-strong bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-ink';

function Field({
  label,
  hint,
  className = '',
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block min-w-[150px] flex-1 ${className}`}>
      <span className="mb-2 block text-[14px] font-medium">
        {label}
        {hint ? <span className="ml-1.5 font-normal text-muted">({hint})</span> : null}
      </span>
      {children}
    </label>
  );
}
