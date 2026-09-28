import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, hasServiceRole, isSupabaseConfigured } from './config';

/**
 * Service-role client. Bypasses RLS, so it is only ever used from route
 * handlers that have already established who is asking: the Razorpay webhook
 * (signature-verified) and scoring jobs.
 */
export function getAdminSupabase() {
  if (!isSupabaseConfigured() || !hasServiceRole()) return null;
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
