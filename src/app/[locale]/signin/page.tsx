import { notFound, redirect } from 'next/navigation';
import { staticPageMetadata } from '@/lib/seo';
import { Wordmark } from '@/components/ui/Wordmark';
import { SignInForm } from '@/components/auth/SignInForm';
import { getDictionary, isLocale, localePath } from '@/lib/i18n';
import { getViewer, resolveDestination } from '@/lib/auth';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return staticPageMetadata('signin', locale);
}

/** The single entry point, for candidates, employers and staff alike. */
export default async function SignInPage({
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

  const viewer = await getViewer();
  if (viewer.role !== 'anonymous') redirect(resolveDestination(viewer, next, locale));

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href={localePath(locale, '/')} />
      </header>
      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(48px,8cqi,96px)]">
        <SignInForm locale={locale} t={t} next={next} />
      </main>
    </>
  );
}
