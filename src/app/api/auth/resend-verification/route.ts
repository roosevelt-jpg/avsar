import { NextResponse } from 'next/server';
import { getSessionCandidate } from '@/lib/auth';
import { sendVerificationLink } from '@/lib/email/verification';

export const runtime = 'nodejs';

/**
 * Sends the verification link again.
 *
 * The address is read from the session, never from the request, so this cannot
 * be pointed at anyone else's inbox. Nothing is revealed about addresses that
 * are not the caller's own, because the caller only ever has one.
 */
export async function POST(request: Request) {
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  /* Already done. Say so rather than sending a second link that will look like
     the first one failed. */
  if (candidate.emailConfirmed) return NextResponse.json({ status: 'already_verified' });

  const result = await sendVerificationLink({
    email: candidate.email,
    name: candidate.fullName,
    locale: candidate.locale,
    origin: new URL(request.url).origin,
  });

  /* Surfaced, because the alternative is someone sitting in front of a screen
     that says a link is on its way when none was sent, waiting and retrying. */
  if (!result.sent) {
    console.error('[resend-verification] failed', result.reason);
    return NextResponse.json({ error: 'send_failed' }, { status: 502 });
  }

  return NextResponse.json({ status: 'sent' });
}
