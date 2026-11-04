import { staticPageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { SignupFlow } from '@/components/candidate/SignupFlow';
import { SignupMarketingShell } from '@/components/candidate/SignupMarketingShell';
import { getDictionary, isLocale } from '@/lib/i18n';
import { POSITIONS, positionBySlug, type PositionSlug } from '@/lib/data/positions';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return staticPageMetadata('signup', locale);
}

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
    <SignupMarketingShell locale={locale}>
      <SignupFlow locale={locale} t={t} initialPosition={initialPosition} />
    </SignupMarketingShell>
  );
}
