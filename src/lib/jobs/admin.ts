import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/** Employers for the job form's select. Internal only. */
export async function employerOptions(): Promise<{ id: string; name: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const admin = getAdminSupabase();
  const { data } = (await admin?.from('employers').select('id, name').order('name')) ?? { data: null };
  return (data ?? []).map((row) => ({ id: String(row.id), name: String(row.name) }));
}
