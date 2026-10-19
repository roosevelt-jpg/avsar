import { z } from 'zod';
import parsePhoneNumberFromString, { type CountryCode } from 'libphonenumber-js';
import { isSupportedCountry } from '@/lib/data/dial-codes';
import { SECTOR_SLUGS } from '@/lib/data/sectors';

/**
 * A mobile number from anywhere, validated against the rules of its own country.
 *
 * It used to be ten digits starting 6 to 9, which is correct for India and
 * wrong for everywhere else, and an applicant may be anywhere even when the
 * market is one country. A regex that covers two hundred and forty-five numbering plans does
 * not exist, so the country comes in beside the number and `libphonenumber-js`
 * answers whether the pair is a real mobile.
 *
 * Validated as a pair rather than as two fields, because neither is meaningful
 * alone: 50 123 4567 is a valid UAE mobile and not a valid Indian one.
 */
export const phoneFields = z
  .object({
    /** ISO 3166-1 alpha-2, from the selector. */
    country: z.string().length(2).toUpperCase(),
    mobile: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s\-().]/g, '')),
  })
  .refine(({ country }) => isSupportedCountry(country), {
    message: 'unknown_country',
    path: ['country'],
  })
  .refine(
    ({ country, mobile }) => {
      const parsed = parsePhoneNumberFromString(mobile, country as CountryCode);
      /* MOBILE or the ambiguous type, because in several countries the ranges
         overlap and the library will not commit. Refusing those would turn a
         real number into a form somebody cannot get past. */
      return Boolean(
        parsed?.isValid() &&
          (parsed.getType() === 'MOBILE' || parsed.getType() === 'FIXED_LINE_OR_MOBILE' || parsed.getType() === undefined),
      );
    },
    { message: 'invalid_mobile', path: ['mobile'] },
  );

/** E.164, which is the only form worth storing. */
export function toE164(country: string, mobile: string): string | null {
  const parsed = parsePhoneNumberFromString(mobile, country as CountryCode);
  return parsed?.isValid() ? parsed.number : null;
}

/**
 * Eight characters, not Supabase's default six.
 *
 * This account opens a file holding a passport number, a CV and an employment
 * history. Also turn on the leaked-password check in the Supabase dashboard
 * (Authentication -> Policies): length alone stops nothing if the password is
 * one of the ones already published.
 */
export const password = z.string().min(8).max(200);

const accountFields = z.object({
    fullName: z.string().trim().min(2).max(120),
    country: z.string().length(2).toUpperCase(),
    mobile: z.string().trim().max(24),
    email: z.string().trim().email().max(200),
  hasPassport: z.boolean(),
});

/**
 * The phone check, applied where a schema is finished rather than in the middle.
 *
 * `superRefine` returns a ZodEffects, and a ZodEffects cannot be extended or
 * merged. Refining the base object would therefore have made it the last thing
 * any schema could do with these fields, so the raw object stays composable and
 * every final schema ends with this.
 */
function withPhoneCheck<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value, ctx) => {
    const { country, mobile } = value as { country: string; mobile: string };
    const result = phoneFields.safeParse({ country, mobile });
    if (result.success) return;
    for (const issue of result.error.issues) ctx.addIssue(issue);
  });
}

export const signupAccountSchema = withPhoneCheck(accountFields);

/** The first step: enough to open the account, and nothing more. */
export const registerSchema = withPhoneCheck(accountFields.extend({ password }));

export type RegisterInput = z.infer<typeof registerSchema>;

export const signupProfileSchema = z.object({
  position: z.string().min(1).max(40),
  yearsExperience: z.number().int().min(0).max(3),
  /* No longer asked at signup: the test measures English, and every question
     before it costs candidates. Still accepted from older clients. */
  englishSelf: z.number().int().min(0).max(2).optional(),
  cityState: z.string().trim().min(2).max(120),
});

export const paymentMethodSchema = z.enum(['upi', 'card', 'netbanking']);

export const signupSchema = withPhoneCheck(
  accountFields.merge(signupProfileSchema).extend({
  /**
   * Mandatory, and stored rather than merely checked.
   *
   * It is the record that the selection odds and the placement fee were shown.
   * It is taken at the end of signup, before the assessment: the fee moved to
   * the end of the flow, and a disclosure that only appears at checkout would
   * now reach somebody after they had already spent ninety minutes answering.
   *
   * No payment method here any more. That is asked for at checkout, which is
   * its own step and its own route.
   */
    consent: z.literal(true),
  }),
);

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
