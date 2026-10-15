import { cache } from 'react';
import { getAnonSupabase } from '@/lib/supabase/anon';
import { getSiteSettings } from '@/lib/cms/data';
import { EMPTY_FUNNEL, type FunnelStats } from './funnel-shared';

/**
 * Counts for the live funnel, through `public_funnel_stats()` (migration
 * 0025), which returns aggregates only. Read with the public key: these
 * numbers are published, so nothing here needs the service role.
 */
export const getFunnelStats = cache(async (): Promise<FunnelStats> => {
  const supabase = getAnonSupabase();
  if (!supabase) return EMPTY_FUNNEL;
  const { hiring } = await getSiteSettings();

  const { data, error } = await supabase.rpc('public_funnel_stats', { p_min_score: hiring.shortlistMinScore });
  if (error) {
    console.error('[stats] funnel read failed', error.message);
    return EMPTY_FUNNEL;
  }
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
  return {
    completed: Number(row?.completed ?? 0),
    qualified: Number(row?.qualified ?? 0),
    shortlisted: Number(row?.shortlisted ?? 0),
    hired: Number(row?.hired ?? 0),
    readAt: new Date().toISOString(),
  };
});
