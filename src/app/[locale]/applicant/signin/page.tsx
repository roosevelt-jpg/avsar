import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { SignInForm } from '@/components/auth/SignInForm';
import { AuthPanel, AuthShell } from '@/components/auth/AuthShell';
import { getDictionary, isLocale, localePath } from '@/lib/i18n';
import { getViewer, resolveDestination } from '@/lib/auth';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMetadata({
    title: t.auth.title,
    description: t.auth.lead,
    path: localePath(locale, '/applicant/signin'),
    locale,
    noindex: true,
  });
}

/**
 * Applicant sign-in. Dedicated path so candidates are not mixed into the
 * shared staff/employer form wording, and so bookmarks and seeds can name
 * one URL. Default destination is the candidate dashboard.
 */
export default async function ApplicantSignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next } = await searchParams;
  const t = getDictionary(locale);

  const destination =
    next && next.startsWith('/') && !next.startsWith('//')
      ? next
      : localePath(locale, '/dashboard');

  const viewer = await getViewer();
  if (viewer.role !== 'anonymous') redirect(resolveDestination(viewer, destination, locale));

  return (
    <AuthShell
      header={
        <>
          <Wordmark href={localePath(locale, '/')} tone="dark" />
          <p className="m-0 text-[14px] text-white/80">
            <Link href={localePath(locale, '/signup')} className="t-colors text-white underline-offset-2 hover:text-[var(--color-gold)] hover:underline">
              {t.auth.registerCta}
            </Link>
          </p>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-[480px] flex-1 items-center">
        <AuthPanel className="w-full">
          <SignInForm locale={locale} t={t} next={destination} note={t.auth.lead} />
        </AuthPanel>
      </div>
    </AuthShell>
  );
}
