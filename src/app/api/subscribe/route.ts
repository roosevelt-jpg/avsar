import { NextResponse } from 'next/server';
import { z } from 'zod';
import { log, requestIdOf } from '@/lib/observability/log';
import { clientIp, rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { locales } from '@/lib/i18n/path';

export const runtime = 'nodejs';

const schema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    locale: z.enum(locales).optional(),
    /* A field people cannot see. Anything in it came from a bot. */
    website: z.string().max(200).optional(),
  })
  .strict();

/**
 * The footer's "new jobs by email" box.
 *
 * Anonymous and one field, so it is rate limited per address and answers the
 * same way whether the email was new or already on the list: the response
 * must not tell a stranger who has signed up.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await rateLimit(RATE_LIMITS.subscribe, ip);
  if (!limited.ok) return rateLimitedResponse(limited);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'validation_failed' }, { status: 422 });
  if (parsed.data.website) return NextResponse.json({ status: 'subscribed' }, { status: 201 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'not_configured', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  /* Signing up again after unsubscribing is a fresh consent, so it clears the
     unsubscribe and restamps the date. */
  const { error } = await admin.from('newsletter_subscribers').upsert(
    {
      email: parsed.data.email,
      locale: parsed.data.locale ?? null,
      source: 'footer',
      subscribed_at: new Date().toISOString(),
      unsubscribed_at: null,
    },
    { onConflict: 'email' },
  );
  if (error) {
    log.error('subscribe.insert_failed', { requestId: requestIdOf(request), error: error.message });
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }
  return NextResponse.json({ status: 'subscribed' }, { status: 201 });
}
