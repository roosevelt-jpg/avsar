/**
 * Job postings, as the app uses them. Client-safe: types and pure helpers only.
 */

export const JOB_STATUSES = ['draft', 'published', 'closed', 'archived'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'seasonal', 'contract'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const HOUSING_OPTIONS = ['provided', 'assisted', 'not_included'] as const;
export type Housing = (typeof HOUSING_OPTIONS)[number];

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type ScreeningQuestion = {
  id: string;
  label: string;
  type: 'text' | 'yesno' | 'select';
  options?: string[];
  required: boolean;
};

export type Job = {
  id: string;
  slug: string;
  title: string;
  positionSlug: string | null;
  area: string | null;
  employerId: string | null;
  employerDisplay: string;
  city: string;
  region: string | null;
  country: string;
  employmentType: EmploymentType;
  contractMonths: number | null;
  openings: number;
  salaryMinEur: number | null;
  salaryMaxEur: number | null;
  salaryPeriod: 'hour' | 'month' | 'year';
  housing: Housing;
  mealsIncluded: boolean;
  visaSponsored: boolean;
  relocationSupport: boolean;
  minExperienceYears: number;
  minEnglish: string | null;
  languages: string[];
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  screeningQuestions: ScreeningQuestion[];
  heroImageUrl: string | null;
  status: JobStatus;
  featured: boolean;
  publishedAt: string | null;
  closesAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  seasonal: 'Seasonal',
  contract: 'Fixed-term contract',
};

export const HOUSING_LABELS: Record<Housing, string> = {
  provided: 'Housing provided',
  assisted: 'Help finding housing',
  not_included: 'Housing not included',
};

export const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal',
  ES: 'Spain',
  AE: 'United Arab Emirates',
};

const PERIOD_LABEL = { hour: 'hour', month: 'month', year: 'year' } as const;

/** "€1,050 to €1,250 a month", or null when no salary was given. */
export function formatSalary(job: Pick<Job, 'salaryMinEur' | 'salaryMaxEur' | 'salaryPeriod'>): string | null {
  const fmt = (n: number) => `€${n.toLocaleString('en-US')}`;
  const period = PERIOD_LABEL[job.salaryPeriod];
  if (job.salaryMinEur != null && job.salaryMaxEur != null && job.salaryMaxEur !== job.salaryMinEur) {
    return `${fmt(job.salaryMinEur)} – ${fmt(job.salaryMaxEur)} / ${period}`;
  }
  const one = job.salaryMinEur ?? job.salaryMaxEur;
  return one != null ? `${fmt(one)} / ${period}` : null;
}

export function jobLocation(job: Pick<Job, 'city' | 'region' | 'country'>): string {
  const country = COUNTRY_NAMES[job.country] ?? job.country;
  return [job.city, job.region, country].filter(Boolean).join(', ');
}

export function isOpen(job: Pick<Job, 'status' | 'closesAt'>, now = new Date()): boolean {
  return job.status === 'published' && (!job.closesAt || new Date(job.closesAt) > now);
}

/** Lower-case, hyphenated, ASCII. Used to suggest a slug from a title. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Row from Postgres (snake_case) to the app shape. */
export function jobFromRow(row: Record<string, unknown>): Job {
  const arr = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
  const num = (value: unknown) => (value == null ? null : Number(value));
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title ?? ''),
    positionSlug: (row.position_slug as string | null) ?? null,
    area: (row.area as string | null) ?? null,
    employerId: (row.employer_id as string | null) ?? null,
    employerDisplay: String(row.employer_display ?? ''),
    city: String(row.city ?? ''),
    region: (row.region as string | null) ?? null,
    country: String(row.country ?? 'PT'),
    employmentType: (row.employment_type as EmploymentType) ?? 'full_time',
    contractMonths: num(row.contract_months),
    openings: Number(row.openings ?? 1),
    salaryMinEur: num(row.salary_min_eur),
    salaryMaxEur: num(row.salary_max_eur),
    salaryPeriod: (row.salary_period as Job['salaryPeriod']) ?? 'month',
    housing: (row.housing as Housing) ?? 'assisted',
    mealsIncluded: Boolean(row.meals_included),
    visaSponsored: row.visa_sponsored !== false,
    relocationSupport: row.relocation_support !== false,
    minExperienceYears: Number(row.min_experience_years ?? 0),
    minEnglish: (row.min_english as string | null) ?? null,
    languages: arr(row.languages),
    summary: String(row.summary ?? ''),
    description: String(row.description ?? ''),
    responsibilities: arr(row.responsibilities),
    requirements: arr(row.requirements),
    benefits: arr(row.benefits),
    screeningQuestions: Array.isArray(row.screening_questions)
      ? (row.screening_questions as ScreeningQuestion[])
      : [],
    heroImageUrl: (row.hero_image_url as string | null) ?? null,
    status: (row.status as JobStatus) ?? 'draft',
    featured: Boolean(row.featured),
    publishedAt: (row.published_at as string | null) ?? null,
    closesAt: (row.closes_at as string | null) ?? null,
    seoTitle: (row.seo_title as string | null) ?? null,
    seoDescription: (row.seo_description as string | null) ?? null,
    createdAt: String(row.created_at ?? new Date(0).toISOString()),
    updatedAt: String(row.updated_at ?? new Date(0).toISOString()),
  };
}

/** App shape to an insert/update row. Only the editable columns. */
export function jobToRow(job: JobInput): Record<string, unknown> {
  return {
    slug: job.slug,
    title: job.title,
    position_slug: job.positionSlug || null,
    area: job.area || null,
    employer_id: job.employerId || null,
    employer_display: job.employerDisplay,
    city: job.city,
    region: job.region || null,
    country: job.country,
    employment_type: job.employmentType,
    contract_months: job.contractMonths,
    openings: job.openings,
    salary_min_eur: job.salaryMinEur,
    salary_max_eur: job.salaryMaxEur,
    salary_period: job.salaryPeriod,
    housing: job.housing,
    meals_included: job.mealsIncluded,
    visa_sponsored: job.visaSponsored,
    relocation_support: job.relocationSupport,
    min_experience_years: job.minExperienceYears,
    min_english: job.minEnglish || null,
    languages: job.languages,
    summary: job.summary,
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    benefits: job.benefits,
    screening_questions: job.screeningQuestions,
    hero_image_url: job.heroImageUrl || null,
    featured: job.featured,
    closes_at: job.closesAt || null,
    seo_title: job.seoTitle || null,
    seo_description: job.seoDescription || null,
  };
}

export type JobInput = Omit<Job, 'id' | 'status' | 'publishedAt' | 'createdAt' | 'updatedAt'>;
