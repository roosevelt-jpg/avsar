import { getMailer } from '@/lib/email';
import { composeEmail } from '@/lib/email/compose';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { defaultLocale, isLocale, localePath, type Locale } from '@/lib/i18n';

export type PasswordResetResult =
  | { sent: true }
  | { sent: false; reason: 'no_admin' | 'no_mailer' | 'link_failed' | 'send_failed' };

/**
 * Branded password-reset (and employer invite set-password) email.
 *
 * The recovery token is minted with the service role and sent over Resend,
 * same pattern as email verification: Supabase's built-in recovery mail is
 * never used, so the logo, address and socials always match the rest of the
 * product.
 */
export async function sendPasswordResetLink(input: {
  email: string;
  name?: string;
  origin: string;
  locale?: string;
  /** Where to send them after they save the new password. */
  afterPath?: string;
  /** Use the employer welcome template instead of password_reset. */
  kind?: 'reset' | 'employer_welcome';
  company?: string;
}): Promise<PasswordResetResult> {
  const admin = getAdminSupabase();
  if (!admin) return { sent: false, reason: 'no_admin' };

  const mailer = getMailer();
  if (mailer.name === 'noop') return { sent: false, reason: 'no_mailer' };

  const email = input.email.trim().toLowerCase();
  const locale: Locale = input.locale && isLocale(input.locale) ? input.locale : defaultLocale;

  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error('[password-reset] generateLink failed', error?.status, error?.message);
    return { sent: false, reason: 'link_failed' };
  }

  /* `next` is where they go after saving the new password. The callback
     always routes recovery through /reset-password?set=1 first. */
  const after =
    input.afterPath && input.afterPath.startsWith('/') && !input.afterPath.startsWith('//')
      ? input.afterPath
      : localePath(locale, '/dashboard');

  const callback = new URL('/auth/callback', input.origin);
  callback.searchParams.set('token_hash', tokenHash);
  callback.searchParams.set('type', 'recovery');
  callback.searchParams.set('locale', locale);
  callback.searchParams.set('next', after);
  const link = callback.toString();

  const firstName = (input.name?.trim().split(/\s+/)[0] || 'there').slice(0, 80);

  const composed =
    input.kind === 'employer_welcome'
      ? await composeEmail(
          'welcome_employer',
          { first_name: firstName, company: input.company?.trim() || 'your company' },
          {
            origin: input.origin,
            actionUrl: link,
            fallbackNote: 'If the button does not work, copy this link into your browser:',
          },
        )
      : await composeEmail(
          'password_reset',
          { first_name: firstName },
          {
            origin: input.origin,
            actionUrl: link,
            fallbackNote: 'If the button does not work, copy this link into your browser:',
          },
        );

  const { sent } = await mailer.send({
    to: email,
    subject: composed.subject,
    text: composed.text,
    html: composed.html,
  });

  return sent ? { sent: true } : { sent: false, reason: 'send_failed' };
}
