'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MediaField } from '../MediaPicker';
import { AREAS, POSITIONS } from '@/lib/data/positions';
import {
  CEFR_LEVELS,
  EMPLOYMENT_LABELS,
  EMPLOYMENT_TYPES,
  HOUSING_LABELS,
  HOUSING_OPTIONS,
  slugify,
  type Job,
  type JobStatus,
  type ScreeningQuestion,
} from '@/lib/jobs/types';

const INPUT = 'w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink';

type Employer = { id: string; name: string };

type FormState = {
  title: string;
  slug: string;
  positionSlug: string;
  employerId: string;
  employerDisplay: string;
  city: string;
  region: string;
  country: string;
  employmentType: (typeof EMPLOYMENT_TYPES)[number];
  contractMonths: string;
  openings: string;
  salaryMinEur: string;
  salaryMaxEur: string;
  salaryPeriod: 'hour' | 'month' | 'year';
  housing: (typeof HOUSING_OPTIONS)[number];
  mealsIncluded: boolean;
  visaSponsored: boolean;
  relocationSupport: boolean;
  minExperienceYears: string;
  minEnglish: string;
  languages: string;
  summary: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  screeningQuestions: ScreeningQuestion[];
  heroImageUrl: string;
  featured: boolean;
  closesAt: string;
  seoTitle: string;
  seoDescription: string;
};

function toForm(job: Job | null): FormState {
  return {
    title: job?.title ?? '',
    slug: job?.slug ?? '',
    positionSlug: job?.positionSlug ?? '',
    employerId: job?.employerId ?? '',
    employerDisplay: job?.employerDisplay ?? '',
    city: job?.city ?? '',
    region: job?.region ?? '',
    country: job?.country ?? 'PT',
    employmentType: job?.employmentType ?? 'full_time',
    contractMonths: job?.contractMonths != null ? String(job.contractMonths) : '24',
    openings: String(job?.openings ?? 1),
    salaryMinEur: job?.salaryMinEur != null ? String(job.salaryMinEur) : '',
    salaryMaxEur: job?.salaryMaxEur != null ? String(job.salaryMaxEur) : '',
    salaryPeriod: job?.salaryPeriod ?? 'month',
    housing: job?.housing ?? 'assisted',
    mealsIncluded: job?.mealsIncluded ?? false,
    visaSponsored: job?.visaSponsored ?? true,
    relocationSupport: job?.relocationSupport ?? true,
    minExperienceYears: String(job?.minExperienceYears ?? 1),
    minEnglish: job?.minEnglish ?? 'A2',
    languages: (job?.languages ?? ['English']).join(', '),
    summary: job?.summary ?? '',
    description: job?.description ?? '',
    responsibilities: (job?.responsibilities ?? []).join('\n'),
    requirements: (job?.requirements ?? []).join('\n'),
    benefits: (job?.benefits ?? []).join('\n'),
    screeningQuestions: job?.screeningQuestions ?? [],
    heroImageUrl: job?.heroImageUrl ?? '',
    featured: job?.featured ?? false,
    closesAt: job?.closesAt ? job.closesAt.slice(0, 10) : '',
    seoTitle: job?.seoTitle ?? '',
    seoDescription: job?.seoDescription ?? '',
  };
}

const lines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean);
const intOrNull = (value: string) => (value.trim() === '' ? null : Math.round(Number(value)));

function toPayload(form: FormState) {
  const position = POSITIONS.find((p) => p.slug === form.positionSlug);
  return {
    slug: form.slug,
    title: form.title,
    positionSlug: form.positionSlug || null,
    area: position?.area ?? null,
    employerId: form.employerId || null,
    employerDisplay: form.employerDisplay,
    city: form.city,
    region: form.region || null,
    country: form.country,
    employmentType: form.employmentType,
    contractMonths: intOrNull(form.contractMonths),
    openings: Number(form.openings) || 1,
    salaryMinEur: intOrNull(form.salaryMinEur),
    salaryMaxEur: intOrNull(form.salaryMaxEur),
    salaryPeriod: form.salaryPeriod,
    housing: form.housing,
    mealsIncluded: form.mealsIncluded,
    visaSponsored: form.visaSponsored,
    relocationSupport: form.relocationSupport,
    minExperienceYears: Number(form.minExperienceYears) || 0,
    minEnglish: form.minEnglish || null,
    languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
    summary: form.summary,
    description: form.description,
    responsibilities: lines(form.responsibilities),
    requirements: lines(form.requirements),
    benefits: lines(form.benefits),
    screeningQuestions: form.screeningQuestions,
    heroImageUrl: form.heroImageUrl || null,
    featured: form.featured,
    closesAt: form.closesAt ? new Date(`${form.closesAt}T23:59:59Z`).toISOString() : null,
    seoTitle: form.seoTitle || null,
    seoDescription: form.seoDescription || null,
  };
}

function Section({ title, children, lead }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-line bg-surface p-5">
      <h2 className="m-0 text-[16px] font-semibold">{title}</h2>
      {lead ? <p className="m-0 mt-1 text-[13px] text-muted">{lead}</p> : null}
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function L({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {help ? <span className="text-[12px] text-muted">{help}</span> : null}
    </label>
  );
}

/**
 * Create and edit a job posting.
 *
 * A posting is saved as a draft first; publishing is a separate action with
 * its own permission, so a recruiter can prepare postings that a manager
 * approves.
 */
export function JobForm({
  job,
  employers,
  canPublish,
}: {
  job: Job | null;
  employers: Employer[];
  canPublish: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(job));
  const [slugTouched, setSlugTouched] = useState(Boolean(job));
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const status: JobStatus = job?.status ?? 'draft';

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function save(nextStatus?: JobStatus) {
    setBusy(nextStatus ?? 'save');
    setMessage(null);
    try {
      const response = await fetch(job ? `/api/admin/jobs/${job.id}` : '/api/admin/jobs', {
        method: job ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ job: toPayload(form), status: nextStatus }),
      });
      const data = (await response.json().catch(() => null)) as { id?: string; error?: string; issues?: { fieldErrors?: Record<string, string[]> } } | null;
      if (!response.ok) {
        const fields = data?.issues?.fieldErrors ? Object.keys(data.issues.fieldErrors).join(', ') : '';
        const reasons: Record<string, string> = {
          slug_taken: 'Another job already uses this web address. Change the slug.',
          demo_mode: 'Demo mode: nothing can be saved without Supabase.',
          forbidden: 'Your role cannot do this.',
          validation_failed: `Please check: ${fields}`,
        };
        setMessage({ tone: 'error', text: reasons[data?.error ?? ''] ?? 'Could not save.' });
        return;
      }
      setMessage({ tone: 'ok', text: nextStatus === 'published' ? 'Published. It is live on the jobs board.' : 'Saved.' });
      if (!job && data?.id) router.push(`/admin/jobs/${data.id}`);
      else router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function setQuestion(index: number, next: Partial<ScreeningQuestion>) {
    set('screeningQuestions', form.screeningQuestions.map((q, i) => (i === index ? { ...q, ...next } : q)));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-5">
        <Section title="The job">
          <L label="Job title">
            <input
              className={INPUT}
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (!slugTouched) set('slug', slugify(`${e.target.value} ${form.city}`));
              }}
              placeholder="Line cook"
            />
          </L>
          <div className="grid gap-3 sm:grid-cols-2">
            <L label="Role" help="Links the job to its photo, assessment and category.">
              <select className={INPUT} value={form.positionSlug} onChange={(e) => set('positionSlug', e.target.value)}>
                <option value="">Not linked</option>
                {AREAS.map((area) => (
                  <optgroup key={area.slug} label={area.label}>
                    {POSITIONS.filter((p) => p.area === area.slug).map((p) => (
                      <option key={p.slug} value={p.slug}>{p.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </L>
            <L label="Web address" help={`/jobs/${form.slug || '...'}`}>
              <input className={INPUT} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            </L>
          </div>
          <L label="One-line summary" help="Shown on job cards. Up to 300 characters.">
            <textarea className={INPUT} rows={2} maxLength={300} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
          </L>
          <L label="Description" help="Formatting: **bold**, lists with “- ”, headings with “## ”.">
            <textarea className={INPUT} rows={8} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </L>
        </Section>

        <Section title="Employer and place">
          <div className="grid gap-3 sm:grid-cols-2">
            <L label="Employer (internal)" help="Never shown to candidates.">
              <select className={INPUT} value={form.employerId} onChange={(e) => set('employerId', e.target.value)}>
                <option value="">Not linked</option>
                {employers.map((employer) => (
                  <option key={employer.id} value={employer.id}>{employer.name}</option>
                ))}
              </select>
            </L>
            <L label="Employer as candidates see it" help="e.g. “Four-star resort hotel”">
              <input className={INPUT} value={form.employerDisplay} onChange={(e) => set('employerDisplay', e.target.value)} />
            </L>
            <L label="City">
              <input className={INPUT} value={form.city} onChange={(e) => { set('city', e.target.value); if (!slugTouched) set('slug', slugify(`${form.title} ${e.target.value}`)); }} />
            </L>
            <L label="Region"><input className={INPUT} value={form.region} onChange={(e) => set('region', e.target.value)} /></L>
            <L label="Country">
              <select className={INPUT} value={form.country} onChange={(e) => set('country', e.target.value)}>
                <option value="PT">Portugal</option>
                <option value="ES">Spain</option>
                <option value="AE">United Arab Emirates</option>
              </select>
            </L>
            <L label="Openings"><input type="number" min={1} className={INPUT} value={form.openings} onChange={(e) => set('openings', e.target.value)} /></L>
          </div>
        </Section>

        <Section title="Contract and pay" lead="Candidates decide on these. Be precise.">
          <div className="grid gap-3 sm:grid-cols-3">
            <L label="Contract type">
              <select className={INPUT} value={form.employmentType} onChange={(e) => set('employmentType', e.target.value as FormState['employmentType'])}>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{EMPLOYMENT_LABELS[type]}</option>
                ))}
              </select>
            </L>
            <L label="Length (months)"><input type="number" className={INPUT} value={form.contractMonths} onChange={(e) => set('contractMonths', e.target.value)} /></L>
            <L label="Pay period">
              <select className={INPUT} value={form.salaryPeriod} onChange={(e) => set('salaryPeriod', e.target.value as FormState['salaryPeriod'])}>
                <option value="month">per month</option>
                <option value="hour">per hour</option>
                <option value="year">per year</option>
              </select>
            </L>
            <L label="Salary from (€, gross)"><input type="number" className={INPUT} value={form.salaryMinEur} onChange={(e) => set('salaryMinEur', e.target.value)} /></L>
            <L label="Salary to (€, gross)"><input type="number" className={INPUT} value={form.salaryMaxEur} onChange={(e) => set('salaryMaxEur', e.target.value)} /></L>
            <L label="Housing">
              <select className={INPUT} value={form.housing} onChange={(e) => set('housing', e.target.value as FormState['housing'])}>
                {HOUSING_OPTIONS.map((option) => (
                  <option key={option} value={option}>{HOUSING_LABELS[option]}</option>
                ))}
              </select>
            </L>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.mealsIncluded} onChange={(e) => set('mealsIncluded', e.target.checked)} /> Meals included</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.visaSponsored} onChange={(e) => set('visaSponsored', e.target.checked)} /> Employer supports the work visa</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.relocationSupport} onChange={(e) => set('relocationSupport', e.target.checked)} /> Relocation support</label>
          </div>
        </Section>

        <Section title="Requirements">
          <div className="grid gap-3 sm:grid-cols-3">
            <L label="Minimum experience (years)"><input type="number" min={0} className={INPUT} value={form.minExperienceYears} onChange={(e) => set('minExperienceYears', e.target.value)} /></L>
            <L label="Minimum English">
              <select className={INPUT} value={form.minEnglish} onChange={(e) => set('minEnglish', e.target.value)}>
                <option value="">None</option>
                {CEFR_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </L>
            <L label="Languages" help="Comma separated"><input className={INPUT} value={form.languages} onChange={(e) => set('languages', e.target.value)} /></L>
          </div>
          <L label="What you will do" help="One per line"><textarea className={INPUT} rows={4} value={form.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} /></L>
          <L label="What the employer is looking for" help="One per line"><textarea className={INPUT} rows={4} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} /></L>
          <L label="What you get" help="One per line"><textarea className={INPUT} rows={4} value={form.benefits} onChange={(e) => set('benefits', e.target.value)} /></L>
        </Section>

        <Section title="Screening questions" lead="Asked when a candidate applies. Keep them few and short; every question costs applications.">
          {form.screeningQuestions.map((question, index) => (
            <div key={index} className="grid gap-2 rounded-[12px] bg-paper p-3 sm:grid-cols-[minmax(0,1fr)_130px_auto_auto]">
              <input className={INPUT} placeholder="Question" value={question.label} onChange={(e) => setQuestion(index, { label: e.target.value })} />
              <select className={INPUT} value={question.type} onChange={(e) => setQuestion(index, { type: e.target.value as ScreeningQuestion['type'] })}>
                <option value="yesno">Yes / no</option>
                <option value="text">Short answer</option>
                <option value="select">Choice</option>
              </select>
              <label className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" checked={question.required} onChange={(e) => setQuestion(index, { required: e.target.checked })} /> Required</label>
              <button type="button" onClick={() => set('screeningQuestions', form.screeningQuestions.filter((_, i) => i !== index))} className="cursor-pointer rounded-[8px] border border-line bg-surface px-2 text-[12px] text-accent-deep">Remove</button>
              {question.type === 'select' && (
                <input className={`${INPUT} sm:col-span-4`} placeholder="Choices, comma separated" value={(question.options ?? []).join(', ')} onChange={(e) => setQuestion(index, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })} />
              )}
            </div>
          ))}
          {form.screeningQuestions.length < 10 && (
            <button type="button" onClick={() => set('screeningQuestions', [...form.screeningQuestions, { id: `q_${Date.now().toString(36)}`, label: '', type: 'yesno', required: false }])} className="cursor-pointer self-start rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px]">
              + Add question
            </button>
          )}
        </Section>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
        <section className="rounded-[18px] border border-line bg-surface p-4">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Status</p>
          <p className="m-0 mt-1 text-[15px] font-semibold capitalize">{status}</p>
          {message && <p className={`m-0 mt-2 text-[13px] ${message.tone === 'ok' ? 'text-[oklch(0.42_0.12_150)]' : 'text-accent-deep'}`}>{message.text}</p>}
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" disabled={Boolean(busy)} onClick={() => save()} className="cursor-pointer rounded-full border border-line-strong bg-surface px-4 py-2.5 text-[14px] font-medium disabled:opacity-60">
              {busy === 'save' ? 'Saving…' : job ? 'Save changes' : 'Save as draft'}
            </button>
            {canPublish && status !== 'published' && (
              <button type="button" disabled={Boolean(busy)} onClick={() => save('published')} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2.5 text-[14px] font-medium text-paper disabled:opacity-60">
                {busy === 'published' ? 'Publishing…' : 'Save and publish'}
              </button>
            )}
            {canPublish && job && status === 'published' && (
              <button type="button" disabled={Boolean(busy)} onClick={() => confirm('Close this job? It leaves the jobs board and stops taking applications.') && save('closed')} className="cursor-pointer rounded-full border border-line bg-paper px-4 py-2 text-[13px]">
                Close applications
              </button>
            )}
            {canPublish && job && status !== 'archived' && status !== 'published' && (
              <button type="button" disabled={Boolean(busy)} onClick={() => save('archived')} className="cursor-pointer rounded-full border border-line bg-paper px-4 py-2 text-[13px] text-muted">
                Archive
              </button>
            )}
            {job && status === 'published' && (
              <a href={`/jobs/${job.slug}`} target="_blank" rel="noreferrer" className="px-4 py-2 text-center text-[14px] text-ink-2">View live ↗</a>
            )}
          </div>
        </section>

        <section className="rounded-[18px] border border-line bg-surface p-4">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Presentation</p>
          <div className="mt-3 flex flex-col gap-3">
            <MediaField label="Image" accept="image" value={form.heroImageUrl} onChange={(url) => set('heroImageUrl', url)} />
            <p className="m-0 text-[12px] text-muted">Leave empty to use the role’s photograph.</p>
            <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured (shown first)</label>
            <L label="Applications close on" help="Leave empty to keep it open until you close it.">
              <input type="date" className={INPUT} value={form.closesAt} onChange={(e) => set('closesAt', e.target.value)} />
            </L>
          </div>
        </section>

        <details className="rounded-[18px] border border-line bg-surface p-4">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Search engines</summary>
          <div className="mt-3 flex flex-col gap-3">
            <L label={`Title (${form.seoTitle.length}/70)`}><input className={INPUT} maxLength={70} value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} /></L>
            <L label={`Description (${form.seoDescription.length}/170)`}><textarea className={INPUT} rows={3} maxLength={170} value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} /></L>
          </div>
        </details>
      </aside>
    </div>
  );
}
