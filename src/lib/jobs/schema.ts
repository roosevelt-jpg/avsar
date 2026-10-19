import { z } from 'zod';
import { CEFR_LEVELS, EMPLOYMENT_TYPES, HOUSING_OPTIONS, JOB_STATUSES } from './types';

/**
 * What the console may send for a job posting. Server-side only in effect:
 * the client form uses the same shape, but this is what decides.
 */

const line = z.string().trim().min(1).max(300);

export const screeningQuestionSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9_-]{1,40}$/),
  label: z.string().trim().min(3).max(200),
  type: z.enum(['text', 'yesno', 'select']),
  options: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  required: z.boolean(),
});

export const jobInputSchema = z
  .object({
    slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lower-case words joined by hyphens').max(80),
    title: z.string().trim().min(3).max(140),
    positionSlug: z.string().trim().max(40).nullable(),
    area: z.string().trim().max(40).nullable(),
    employerId: z.string().uuid().nullable(),
    employerDisplay: z.string().trim().max(140),
    city: z.string().trim().min(2).max(80),
    region: z.string().trim().max(80).nullable(),
    country: z.string().trim().length(2).toUpperCase(),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    contractMonths: z.number().int().min(1).max(120).nullable(),
    openings: z.number().int().min(1).max(500),
    salaryMinEur: z.number().int().min(0).max(1_000_000).nullable(),
    salaryMaxEur: z.number().int().min(0).max(1_000_000).nullable(),
    salaryPeriod: z.enum(['hour', 'month', 'year']),
    housing: z.enum(HOUSING_OPTIONS),
    mealsIncluded: z.boolean(),
    visaSponsored: z.boolean(),
    relocationSupport: z.boolean(),
    minExperienceYears: z.number().int().min(0).max(40),
    minEnglish: z.enum(CEFR_LEVELS).nullable(),
    languages: z.array(z.string().trim().min(1).max(40)).max(10),
    summary: z.string().trim().max(300),
    description: z.string().trim().max(10_000),
    responsibilities: z.array(line).max(30),
    requirements: z.array(line).max(30),
    benefits: z.array(line).max(30),
    screeningQuestions: z.array(screeningQuestionSchema).max(10),
    heroImageUrl: z.string().trim().max(500).nullable(),
    featured: z.boolean(),
    closesAt: z.string().datetime({ offset: true }).nullable(),
    seoTitle: z.string().trim().max(70).nullable(),
    seoDescription: z.string().trim().max(170).nullable(),
  })
  .refine(
    (job) => job.salaryMinEur == null || job.salaryMaxEur == null || job.salaryMaxEur >= job.salaryMinEur,
    { message: 'maximum below minimum', path: ['salaryMaxEur'] },
  );

export const jobStatusSchema = z.enum(JOB_STATUSES);
