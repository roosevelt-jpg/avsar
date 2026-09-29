import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

/**
 * Browser client, used only where the auth flow genuinely has to run client
 * side: sending and verifying the one-time code. Everything else reads through
 * the server client so RLS is evaluated against a session the server trusts.
 */
export function getBrowserSupabase() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
