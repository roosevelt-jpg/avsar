/**
 * The database is required. Without these variables the root layout renders a
 * setup page naming what is missing, and data functions return empty values
 * rather than crash, so a build can still run on a machine with no secrets.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

export function hasServiceRole(): boolean {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').length > 0;
}
