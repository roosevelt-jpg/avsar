/**
 * Supabase is optional at build and dev time. Every data path falls back to the
 * sample talent pool and in-memory state when it is not configured, so the whole
 * UI stays reviewable before any infrastructure exists.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

export function hasServiceRole(): boolean {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').length > 0;
}
