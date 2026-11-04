import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { getMailer, unsubscribeToken } from '@/lib/email';
import { composeEmail } from '@/lib/email/compose';
import { localePath } from '@/lib/i18n';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

const schema = z
  .object({
    title: z.string().trim().min(3).max(200),
    body: z.string().trim().min(20).max(8000),
  })
  .strict();

type SubscriberRow = { id: string; email: string; locale: string | null };

/**
 * Compose one News & Insights letter, publish it on the site, and send it
 * through Resend to every active footer subscriber.
 */
export async function POST(request: Request) {
  const guard = await apiPermission('leads.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'validation_failed' }, { status: 422 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const { data: inserted, error: insertError } = await admin
    .from('newsletters')
    .insert({
      title: parsed.data.title,
      body: parsed.data.body,
      status: 'draft',
      created_by: guard.userId,
    })
    .select('id')
    .single();
  if (insertError || !inserted) {
    return NextResponse.json({ error: 'save_failed', detail: insertError?.message }, { status: 500 });
  }

  const { data: subscriberRows, error: subscribersError } = await admin
    .from('newsletter_subscribers')
    .select('id, email, locale')
    .is('unsubscribed_at', null)
    .limit(1000);
  if (subscribersError) {
    return NextResponse.json({ error: 'subscribers_failed', detail: subscribersError.message }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const mailer = getMailer();
  let sent = 0;
  let failed = 0;

  for (const subscriber of (subscriberRows ?? []) as SubscriberRow[]) {
    const locale = subscriber.locale ?? 'en';
    const unsubscribe = `${origin}/api/unsubscribe?n=${subscriber.id}&t=${unsubscribeToken(subscriber.id, 'newsletter')}`;
    const newsUrl = `${origin}${localePath(locale, '/news-and-insights')}`;
    const email = await composeEmail(
      'newsletter_insights',
      { title: parsed.data.title, body: parsed.data.body },
      { origin, actionUrl: newsUrl, unsubscribe: { label: 'Unsubscribe', url: unsubscribe } },
    );
    const result = await mailer.send({ to: subscriber.email, ...email, unsubscribeUrl: unsubscribe });
    if (result.sent) sent += 1;
    else failed += 1;
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from('newsletters')
    .update({
      status: 'sent',
      sent_at: now,
      sent_count: sent,
      fail_count: failed,
    })
    .eq('id', inserted.id);
  if (updateError) {
    console.error('[newsletter] mark sent failed', updateError.message);
  }

  await audit(guard.userId, 'newsletter.send', `newsletter:${inserted.id}`, {
    title: parsed.data.title,
    considered: subscriberRows?.length ?? 0,
    sent,
    failed,
    mailer: mailer.name,
  });

  return NextResponse.json({
    ok: true,
    id: inserted.id,
    considered: subscriberRows?.length ?? 0,
    sent,
    failed,
    mailer: mailer.name,
  });
}
