import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

/**
 * Server-side client with the anon key and no session persistence.
 *
 * Used for auth calls the server makes on a visitor's behalf, where we do not
 * want the result stored as this server's own session.
 */
export function getAnonSupabase() {
  if (!isSupabaseConfigured()) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
