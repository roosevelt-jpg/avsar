import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { AuthPanel, AuthShell } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { getViewer } from '@/lib/auth';
import { isLocale, localePath } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({
    title: 'Reset password',
    description: 'Choose a new password for your account.',
    path: localePath(locale, '/reset-password'),
    locale,
    noindex: true,
  });
}

/**
 * Request a reset email, or set a new password after the recovery link.
 *
 * `?set=1` is only valid with a session (the recovery callback creates one).
 * Without a session the visitor is sent to request a new link.
 */
export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ set?: string; next?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const setting = query.set === '1';
  const next = query.next;

  const viewer = await getViewer();
  if (setting && viewer.role === 'anonymous') {
    redirect(localePath(locale, '/reset-password'));
  }

  return (
    <AuthShell
      header={
        <>
          <Wordmark href={localePath(locale, '/')} />
          <p className="m-0 text-[14px] text-ink-2">
            <Link href={localePath(locale, '/signin')} className="prose-link">
              Sign in
            </Link>
          </p>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-[480px] flex-1 items-center">
        <AuthPanel className="w-full">
          <ResetPasswordForm locale={locale} mode={setting ? 'set' : 'request'} next={next} />
        </AuthPanel>
      </div>
    </AuthShell>
  );
}
