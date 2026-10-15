import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { SignupFlow } from '@/components/candidate/SignupFlow';
import { OrderSummary } from '@/components/candidate/OrderSummary';
import { ENTITY } from '@/lib/data/brand';
import { fill, getDictionary, isLocale, localePath } from '@/lib/i18n';
import { POSITIONS, positionBySlug, type PositionSlug } from '@/lib/data/positions';

export const metadata = { title: 'Register for Cohort 01' };

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ position?: string; status?: string; receipt?: string; session_id?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const t = getDictionary(locale);

  /* Position carried over from the landing page's selector. */
  const initialPosition: PositionSlug = positionBySlug(query.position ?? '')
    ? (query.position as PositionSlug)
    : POSITIONS[0].slug;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[18px]">
        <Wordmark href={localePath(locale, '/')} />
        <p className="m-0 text-[14px] text-muted">
          <Link href={localePath(locale, '/contact')} className="prose-link">
            {fill(t.signup.help, { phone: ENTITY.phone })}
          </Link>
        </p>
      </header>

      <main className="flex flex-col gap-[clamp(28px,4cqi,56px)] px-[clamp(20px,4cqi,56px)] py-[clamp(36px,6cqi,72px)] lg:flex-row lg:items-start">
        <SignupFlow
          locale={locale}
          t={t}
          initialPosition={initialPosition}
        />
        <OrderSummary t={t} />
      </main>
    </>
  );
}
