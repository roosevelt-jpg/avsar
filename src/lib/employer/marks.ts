import { cache } from 'react';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { getAnonSupabase } from '@/lib/supabase/anon';

export type EmployerMark = {
  id: string;
  name: string;
  logoUrl: string | null;
};

/**
 * The companies on the homepage strip.
 *
 * Read through `public_employer_marks()` (migration 0035) with the public
 * key. The function returns a name and a logo path and nothing else, so the
 * homepage does not need the service role. A missing function, which is the
 * state before that migration is applied, leaves the strip empty rather than
 * breaking the page.
 */
export const listPublicEmployers = cache(async (): Promise<EmployerMark[]> => {
  const supabase = getAnonSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('public_employer_marks');
  if (error) {
    console.error('[employers] public marks failed', error.message);
    return [];
  }
  const rows = (Array.isArray(data) ? data : []) as { id?: unknown; name?: unknown; logo_path?: unknown }[];
  return rows.flatMap((row) => {
    const id = typeof row.id === 'string' ? row.id : '';
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!id || !name) return [];
    const path = typeof row.logo_path === 'string' ? row.logo_path : '';
    const logoUrl = path && SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/employer-logos/${path}` : null;
    return [{ id, name, logoUrl }];
  });
});
