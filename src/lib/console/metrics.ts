import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export type ConsoleMetrics = { candidates: number; candidatesWeek: number; paid: number };

/** Headline counts for the console dashboard. */
export async function consoleMetrics(): Promise<ConsoleMetrics> {
  if (!isSupabaseConfigured()) return { candidates: 1284, candidatesWeek: 96, paid: 412 };
  const admin = getAdminSupabase();
  if (!admin) return { candidates: 0, candidatesWeek: 0, paid: 0 };
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [all, week, paid] = await Promise.all([
    admin.from('candidates').select('id', { count: 'exact', head: true }),
    admin.from('candidates').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    admin.from('candidates').select('id', { count: 'exact', head: true }).eq('payment_status', 'paid'),
  ]);
  return { candidates: all.count ?? 0, candidatesWeek: week.count ?? 0, paid: paid.count ?? 0 };
}
