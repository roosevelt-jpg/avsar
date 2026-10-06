import { notFound } from 'next/navigation';
import { renderReminder } from '@/lib/email/reminder';
import { verificationPreview } from '@/lib/email/verification';

export const runtime = 'nodejs';

/**
 * The transactional mail, rendered without sending it.
 *
 * Checking an email used to mean registering a throwaway account, waiting for
 * the provider, and reading the HTML back off its API. That is slow, it writes
 * rows somebody then has to delete, and it is not something to do against a
 * list of real candidates to check a reminder.
 *
 * Development only, like the screen index beside it: it 404s in production,
 * so there is nothing here to leak.
 *
 *   /dev/email?template=verification&locale=hi
 *   /dev/email?template=reminder&locale=en&stage=assessment
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') notFound();

  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') === 'hi' ? 'hi' : 'en';
  const origin = url.origin;

  const html =
    url.searchParams.get('template') === 'reminder'
      ? renderReminder(
          {
            full_name: 'Rohit Sharma',
            locale,
            profile_completed_at:
              url.searchParams.get('stage') === 'assessment' ? new Date().toISOString() : null,
          },
          origin,
          `${origin}/api/unsubscribe?c=preview&t=preview`,
        ).html
      : verificationPreview({
          name: 'Rohit Sharma',
          locale,
          origin,
          link: `${origin}/auth/callback?token_hash=preview&type=magiclink&verify=1&locale=${locale}`,
        });

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
