import { getMailer } from '@/lib/email';
import { composeEmail } from '@/lib/email/compose';
import { isLocale, localePath, type Locale } from '@/lib/i18n';
import { sendPasswordResetLink } from '@/lib/email/password-reset';

/**
 * Welcome email after an applicant opens an account.
 *
 * Separate from the verification link: that one proves the address; this one
 * tells them what to do next on the dashboard. Both use the branded shell.
 */
export async function sendCandidateWelcome(input: {
  email: string;
  name: string;
  locale: string;
  origin: string;
}): Promise<{ sent: boolean }> {
  const mailer = getMailer();
  if (mailer.name === 'noop') return { sent: false };

  const locale: Locale = isLocale(input.locale) ? input.locale : 'en';
  const firstName = (input.name.trim().split(/\s+/)[0] || 'there').slice(0, 80);
  /* Profile is still empty at registration, so the resume point is signup. */
  const actionUrl = `${input.origin}${localePath(locale, '/signup?resume=profile')}`;

  const email = await composeEmail(
    'welcome_candidate',
    { first_name: firstName },
    {
      origin: input.origin,
      actionUrl,
      fallbackNote: 'If the button does not work, copy this link into your browser:',
    },
  );

  const { sent } = await mailer.send({
    to: input.email.trim().toLowerCase(),
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
  return { sent };
}

/**
 * Welcome + set-password for a newly invited employer contact.
 */
export async function sendEmployerWelcome(input: {
  email: string;
  name?: string;
  company: string;
  origin: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const result = await sendPasswordResetLink({
    email: input.email,
    name: input.name || input.company,
    company: input.company,
    origin: input.origin,
    afterPath: '/admin/employer',
    kind: 'employer_welcome',
    locale: 'en',
  });
  return result.sent ? { sent: true } : { sent: false, reason: result.reason };
}
