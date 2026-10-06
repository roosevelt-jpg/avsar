import { getMailer } from '@/lib/email';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { BRAND } from '@/lib/data/brand';

/**
 * The "confirm your address" email, sent by us rather than by Supabase.
 *
 * It used to be `signInWithOtp`, which hands the sending to Supabase's own
 * mailer. That turned out to be the whole bug: the project has "Confirm email"
 * switched off, so `signUp` never sends anything at all, and the magic link
 * that the resend button asked for went out through Supabase's built-in sender
 * rather than the Resend account the rest of the product uses. That sender does
 * two messages an hour for the entire project and delivers only to members of
 * the Supabase team, so a candidate on Gmail got nothing and there was no
 * bounce to look at: in six days of logs not one auth message reached Resend.
 *
 * So the link is minted here with the service role, which sends nothing, and
 * the message goes out over the same Resend account that already delivers the
 * reminders. One provider, one log to read, and no dependency on a dashboard
 * toggle that somebody can change in another tab.
 */

type Copy = { subject: string; body: (link: string, name: string) => string };

const COPY = {
  en: {
    subject: 'Confirm your email address',
    body: (link, name) =>
      `Hi ${name},

Please confirm this is your address. We need it to send you your assessment report, and your application cannot be completed without it.

${link}

The link works once. If it has expired, you can ask for a new one from your dashboard.

If you did not start an application with ${BRAND.name}, you can ignore this message.

${BRAND.name}`,
  },
  hi: {
    subject: 'अपना ईमेल पता सत्यापित करें',
    body: (link, name) =>
      `नमस्ते ${name},

कृपया पुष्टि करें कि यह आपका ईमेल पता है। आपकी मूल्यांकन रिपोर्ट इसी पते पर भेजी जाएगी, और इसके बिना आपका आवेदन पूरा नहीं हो सकता।

${link}

यह लिंक एक बार काम करता है। समय समाप्त हो जाने पर आप अपने डैशबोर्ड से नया लिंक मँगा सकते हैं।

अगर आपने ${BRAND.name} पर कोई आवेदन शुरू नहीं किया है, तो इस संदेश को अनदेखा करें।

${BRAND.name}`,
  },
} satisfies Record<string, Copy>;

export type VerificationResult =
  | { sent: true }
  | { sent: false; reason: 'no_admin' | 'no_mailer' | 'link_failed' | 'send_failed' };

export async function sendVerificationLink({
  email,
  name,
  locale,
  origin,
}: {
  email: string;
  name: string;
  locale: string;
  origin: string;
}): Promise<VerificationResult> {
  const admin = getAdminSupabase();
  if (!admin) return { sent: false, reason: 'no_admin' };

  const mailer = getMailer();
  /* Nothing is minted when there is nowhere to send it. A link generated and
     dropped is still a link that exists and can be used. */
  if (mailer.name === 'noop') return { sent: false, reason: 'no_mailer' };

  /* `generateLink` mints the token and returns it. It does not send, which is
     the point: the sending is ours. */
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });

  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error('[verification] generateLink failed', error?.status, error?.message);
    return { sent: false, reason: 'link_failed' };
  }

  /*
    The hashed token on our own URL, not the `action_link` Supabase hands back.

    That link points at the Supabase domain, and its redirect arrives carrying
    the session in the URL fragment, which a server route cannot read: the
    callback would have found no code, treated the visitor as anonymous and
    sent them to sign in, having proved nothing. `verifyOtp` on our side takes
    the hash and sets the cookies properly.

    It also keeps the whole journey on one domain. A candidate who hovers the
    link sees the site they registered on rather than a project subdomain,
    which is the difference between a link that looks like ours and a link that
    looks like phishing.
  */
  const callback = new URL('/auth/callback', origin);
  callback.searchParams.set('token_hash', tokenHash);
  callback.searchParams.set('type', 'magiclink');
  callback.searchParams.set('verify', '1');
  callback.searchParams.set('locale', locale);
  const link = callback.toString();

  const copy = locale === 'hi' ? COPY.hi : COPY.en;
  const { sent } = await mailer.send({
    to: email,
    subject: copy.subject,
    text: copy.body(link, name),
  });

  return sent ? { sent: true } : { sent: false, reason: 'send_failed' };
}
