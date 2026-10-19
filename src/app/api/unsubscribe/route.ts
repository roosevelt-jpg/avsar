import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { unsubscribeMatches, type UnsubscribeKind } from '@/lib/email';

export const runtime = 'nodejs';

/**
 * Stops the emails.
 *
 * Answers GET and POST alike: a mail client following List-Unsubscribe-Post
 * sends a POST with no session, and a person clicking the link in the message
 * sends a GET. Both must work without signing in, which is the whole point of
 * an unsubscribe link, so the token is what authorises it.
 *
 * Two lists share this route:
 *   - `c` = a registered candidate (reminders and role job alerts)
 *   - `n` = a footer newsletter subscriber (new-jobs digests)
 *
 * It only ever sets `unsubscribed_at`. Nothing else about the record can be
 * reached from an unauthenticated link.
 */
async function unsubscribe(request: Request) {
  const url = new URL(request.url);
  const candidateId = url.searchParams.get('c') ?? '';
  const newsletterId = url.searchParams.get('n') ?? '';
  const token = url.searchParams.get('t') ?? '';

  const kind: UnsubscribeKind | null = candidateId
    ? 'candidate'
    : newsletterId
      ? 'newsletter'
      : null;
  const id = kind === 'candidate' ? candidateId : newsletterId;

  if (!kind || !id || !token || !unsubscribeMatches(id, token, kind)) {
    return new Response('Invalid unsubscribe link', { status: 400 });
  }

  const admin = getAdminSupabase();
  if (!admin) return new Response('Not available', { status: 503 });

  const table = kind === 'candidate' ? 'candidates' : 'newsletter_subscribers';
  const { error } = await admin
    .from(table)
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[unsubscribe] failed', kind, error.message);
    return new Response('Could not complete', { status: 500 });
  }

  /* A mail client doing one-click wants a bare 200, not a page. */
  if (request.method === 'POST') return NextResponse.json({ ok: true });

  const message =
    kind === 'newsletter'
      ? 'You will not receive any more job emails from us.'
      : 'You will not receive any more reminders.';

  return new Response(
    '<!doctype html><meta charset="utf-8"><title>Unsubscribed</title>' +
      '<body style="font:16px/1.6 system-ui;margin:0;display:grid;place-items:center;min-height:100vh">' +
      `<p>${message}</p></body>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

export const GET = unsubscribe;
export const POST = unsubscribe;
