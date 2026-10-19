import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendPasswordResetLink } from '@/lib/email/password-reset';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { clientIp, rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.string().max(8).optional(),
  next: z.string().max(200).optional(),
});

/**
 * Request a branded password-reset email.
 *
 * Always returns the same success shape whether or not the address exists, so
 * the endpoint cannot be used to discover who has an account.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await rateLimit(RATE_LIMITS.resetPassword, ip);
  if (!limited.ok) return rateLimitedResponse(limited);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_failed' }, { status: 422 });
  }

  const email = parsed.data.email.toLowerCase();
  const origin = new URL(request.url).origin;
  const next =
    parsed.data.next && parsed.data.next.startsWith('/') && !parsed.data.next.startsWith('//')
      ? parsed.data.next
      : undefined;

  /* Look up a display name when we can; never tell the browser whether we found one. */
  let name: string | undefined;
  const admin = getAdminSupabase();
  if (admin) {
    const { data: candidate } = await admin
      .from('candidates')
      .select('full_name')
      .ilike('email', email)
      .maybeSingle();
    if (candidate?.full_name) name = String(candidate.full_name);
  }

  const result = await sendPasswordResetLink({
    email,
    name,
    origin,
    locale: parsed.data.locale,
    afterPath: next,
  });

  if (!result.sent && result.reason === 'link_failed') {
    /* Unknown address often fails generateLink; still look like success. */
    return NextResponse.json({ status: 'sent' });
  }

  if (!result.sent && result.reason === 'no_mailer') {
    console.error('[reset-password] mailer not configured');
    return NextResponse.json({ status: 'sent' });
  }

  return NextResponse.json({ status: 'sent' });
}
