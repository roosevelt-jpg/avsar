import { z } from 'zod';
import { SECTOR_SLUGS } from '@/lib/data/sectors';

/** Indian mobile: 10 digits starting 6-9, per the handoff's validation note. */
export const indianMobile = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^[6-9]\d{9}$/));

export const signupAccountSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  mobile: indianMobile,
  email: z.string().trim().email().max(200),
  hasPassport: z.boolean(),
});

export const signupProfileSchema = z.object({
  position: z.string().min(1).max(40),
  yearsExperience: z.number().int().min(0).max(3),
  englishSelf: z.number().int().min(0).max(2),
  cityState: z.string().trim().min(2).max(120),
});

export const paymentMethodSchema = z.enum(['upi', 'card', 'netbanking']);

export const signupSchema = signupAccountSchema.merge(signupProfileSchema).extend({
  method: paymentMethodSchema,
  /**
   * Mandatory. The disclosure about the ~1-in-20,000 odds is the whole reason
   * this field exists, so it is stored with the record, not just checked.
   */
  consent: z.literal(true),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const answerSchema = z.object({
  attemptId: z.string().uuid(),
  itemId: z.string().min(1).max(64),
  optionIndex: z.number().int().min(0).max(9),
});

export const searchSchema = z.object({
  query: z.string().trim().max(400).optional(),
  sector: z.enum(SECTOR_SLUGS).optional(),
  minEnglish: z.enum(['A2', 'B1', 'B2']).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});
