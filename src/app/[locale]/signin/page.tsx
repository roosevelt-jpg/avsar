import { notFound, redirect } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { SignInForm } from '@/components/candidate/SignInForm';
import { getDictionary, isLocale } from '@/lib/i18n';
import { getSessionCandidate } from '@/lib/auth';

export const metadata = { title: 'Sign in' };

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

  /* Only same-origin paths. An open redirect on a sign-in page is how
     credential phishing gets a legitimate-looking link. */
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : `/${locale}/dashboard`;

  if (await getSessionCandidate()) redirect(target);

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href={`/${locale}`} />
      </header>
      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(48px,8cqi,96px)]">
        <SignInForm locale={locale} t={t} next={target} />
      </main>
    </>
  );
}
