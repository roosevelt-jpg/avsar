import { z } from 'zod';
import { getAdminSupabase } from '@/lib/supabase/admin';
/**
 * Background facts that decide how straightforward a Portuguese work visa is:
 * earlier refusals, work abroad, overstays or removals, and family who would
 * follow later. Asked on the dashboard, never at signup, and every question is
 * optional: "not answered" is kept apart from "no".
 */

export type CandidateBackground = {
  visaRefused: boolean | null;
  visaRefusalDetail: string;
  workedAbroad: boolean | null;
  workedAbroadDetail: string;
  overstayOrRemoval: boolean | null;
  overstayDetail: string;
  dependants: number | null;
  dependantsDetail: string;
  updatedAt: string | null;
};

const detail = z.string().trim().max(500);

export const backgroundSchema = z
  .object({
    visaRefused: z.boolean().nullable(),
    visaRefusalDetail: detail,
    workedAbroad: z.boolean().nullable(),
    workedAbroadDetail: detail,
    overstayOrRemoval: z.boolean().nullable(),
    overstayDetail: detail,
    dependants: z.number().int().min(0).max(10).nullable(),
    dependantsDetail: detail,
  })
  .strict();

export type BackgroundInput = z.infer<typeof backgroundSchema>;

export const EMPTY_BACKGROUND: CandidateBackground = {
  visaRefused: null,
  visaRefusalDetail: '',
  workedAbroad: null,
  workedAbroadDetail: '',
  overstayOrRemoval: null,
  overstayDetail: '',
  dependants: null,
  dependantsDetail: '',
  updatedAt: null,
};

export const BACKGROUND_COLUMNS =
  'visa_refused, visa_refusal_detail, worked_abroad, worked_abroad_detail, overstay_or_removal, overstay_detail, dependants, dependants_detail, updated_at';

export function backgroundFrom(row: Record<string, unknown>): CandidateBackground {
  const bool = (value: unknown) => (typeof value === 'boolean' ? value : null);
  return {
    visaRefused: bool(row.visa_refused),
    visaRefusalDetail: String(row.visa_refusal_detail ?? ''),
    workedAbroad: bool(row.worked_abroad),
    workedAbroadDetail: String(row.worked_abroad_detail ?? ''),
    overstayOrRemoval: bool(row.overstay_or_removal),
    overstayDetail: String(row.overstay_detail ?? ''),
    dependants: typeof row.dependants === 'number' ? row.dependants : null,
    dependantsDetail: String(row.dependants_detail ?? ''),
    updatedAt: (row.updated_at as string | null) ?? null,
  };
}

export function backgroundToRow(input: BackgroundInput) {
  /* A detail only makes sense beside a "yes" (or a count above zero); keeping
     text under a "no" would contradict the answer staff read first. */
  return {
    visa_refused: input.visaRefused,
    visa_refusal_detail: input.visaRefused ? input.visaRefusalDetail : '',
    worked_abroad: input.workedAbroad,
    worked_abroad_detail: input.workedAbroad ? input.workedAbroadDetail : '',
    overstay_or_removal: input.overstayOrRemoval,
    overstay_detail: input.overstayOrRemoval ? input.overstayDetail : '',
    dependants: input.dependants,
    dependants_detail: input.dependants ? input.dependantsDetail : '',
  };
}

/** Whether any answer needs a person to look at it before a visa file is started. */
export function backgroundFlags(background: CandidateBackground): string[] {
  const flags: string[] = [];
  if (background.visaRefused) flags.push('Previous visa refusal');
  if (background.overstayOrRemoval) flags.push('Overstay or removal');
  return flags;
}

/**
 * One candidate's answers. Call only for the session's own candidate, or after
 * a permission check in the console.
 */
export async function backgroundFor(candidateId: string | null): Promise<CandidateBackground | null> {
  const admin = getAdminSupabase();
  if (!admin || !candidateId) return null;
  const { data } = await admin.from('candidate_backgrounds').select(BACKGROUND_COLUMNS).eq('candidate_id', candidateId).maybeSingle();
  return data ? backgroundFrom(data as Record<string, unknown>) : null;
}
