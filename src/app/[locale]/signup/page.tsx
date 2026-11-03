import { staticPageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { SignupFlow } from '@/components/candidate/SignupFlow';
import { SignupMarketingShell } from '@/components/candidate/SignupMarketingShell';
import { OrderSummary } from '@/components/candidate/OrderSummary';
import { getSiteSettings } from '@/lib/cms/data';
import { siteText } from '@/lib/cms/localize';
import { FilmButton } from '@/components/cms/VideoPlayer';
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
  const { company, applications, general } = await getSiteSettings();

  /* Position carried over from the landing page's selector. */
  const initialPosition: PositionSlug = positionBySlug(query.position ?? '')
    ? (query.position as PositionSlug)
    : POSITIONS[0].slug;

  return (
    <SignupMarketingShell locale={locale} helpPhone={company.phone}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <SignupFlow locale={locale} t={t} initialPosition={initialPosition} />
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-[280px] lg:shrink-0">
          <OrderSummary locale={locale} company={company} whatsapp={general.whatsapp} />
          {applications.filmUrl && applications.filmLabel ? (
            <div className="flex justify-center">
              <FilmButton src={applications.filmUrl} label={siteText(locale, applications.filmLabel)} />
            </div>
          ) : null}
        </div>
      </div>
    </SignupMarketingShell>
  );
}
