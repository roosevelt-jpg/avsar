import { NextResponse } from 'next/server';
import { getSessionCandidate } from '@/lib/auth';
import { collectCandidateData } from '@/lib/privacy/export';
import { logDataAccess } from '@/lib/privacy/log';
import { clientIp, rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

/**
 * "Download my data", from the dashboard.
 *
 * The privacy notice promises access to everything we hold. Answering that by
 * email takes days and a person; this answers it in a second. Which candidate
 * comes from the session only, so nobody can download someone else's file by
 * guessing an id.
 */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'demo_mode', message: 'Supabase is not configured, so there is no data to export.' }, { status: 503 });
  }
  const limited = await rateLimit(RATE_LIMITS.selfExport, clientIp(request));
  if (!limited.ok) return rateLimitedResponse(limited);

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const data = await collectCandidateData(admin, candidate.id);
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await logDataAccess(null, candidate.id, 'candidate.self_export');

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="my-data.json"',
      'cache-control': 'no-store',
    },
  });
}
