import { z } from 'zod';
import { SECTOR_SLUGS } from '@/lib/data/sectors';

/** YYYY-MM, or empty. Month precision: nobody remembers the day they started. */
const monthString = z.string().regex(/^(\d{4}-(0[1-9]|1[0-2]))?$/);

export const experienceSchema = z.object({
  employer: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(160),
  location: z.string().trim().max(160).optional(),
  startMonth: monthString.optional(),
  endMonth: monthString.optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().max(2000).optional(),
  sector: z.enum(SECTOR_SLUGS).optional(),
});

export const educationSchema = z.object({
  institution: z.string().trim().min(1).max(160),
  qualification: z.string().trim().min(1).max(160),
  field: z.string().trim().max(160).optional(),
  startYear: z.number().int().min(1950).max(2100).optional(),
  endYear: z.number().int().min(1950).max(2100).optional(),
});

export const profileSchema = z.object({
  headline: z.string().trim().max(200).optional(),
  summary: z.string().trim().max(2000).optional(),
  linkedinUrl: z.string().trim().max(300).optional(),
  /** Home city/town from the Places picker; written to candidates.city_state. */
  cityState: z.string().trim().min(2).max(120).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  languages: z
    .array(z.object({ language: z.string().trim().min(1).max(60), level: z.string().trim().max(20) }))
    .max(20)
    .default([]),
  availability: z.enum(['immediate', 'one_month', 'three_months', 'six_months']).optional(),
  relocationReady: z.boolean().default(true),
  experiences: z.array(experienceSchema).max(25).default([]),
  education: z.array(educationSchema).max(15).default([]),
});

export type ProfileInput = z.infer<typeof profileSchema>;
