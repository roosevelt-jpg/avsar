import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { unsubscribeMatches } from '@/lib/email';

export const runtime = 'nodejs';

/**
 * Stops the reminders.
 *
 * Answers GET and POST alike: a mail client following List-Unsubscribe-Post
 * sends a POST with no session, and a person clicking the link in the message
 * sends a GET. Both must work without signing in, which is the whole point of
 * an unsubscribe link, so the token is what authorises it.
 *
 * It only ever sets `unsubscribed_at`. Nothing else about the record can be
 * reached from an unauthenticated link.
 */
async function unsubscribe(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('c') ?? '';
  const token = url.searchParams.get('t') ?? '';

  if (!id || !token || !unsubscribeMatches(id, token)) {
    return new Response('Invalid unsubscribe link', { status: 400 });
  }

  const admin = getAdminSupabase();
  if (!admin) return new Response('Not available', { status: 503 });

  const { error } = await admin
    .from('candidates')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[unsubscribe] failed', error.message);
    return new Response('Could not complete', { status: 500 });
  }

  /* A mail client doing one-click wants a bare 200, not a page. */
  if (request.method === 'POST') return NextResponse.json({ ok: true });

  return new Response(
    '<!doctype html><meta charset="utf-8"><title>Unsubscribed</title>' +
      '<body style="font:16px/1.6 system-ui;margin:0;display:grid;place-items:center;min-height:100vh">' +
      '<p>You will not receive any more reminders.</p></body>',
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

export const GET = unsubscribe;
export const POST = unsubscribe;
