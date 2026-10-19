import Link from 'next/link';
import { staticPageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { SignupFlow } from '@/components/candidate/SignupFlow';
import { OrderSummary } from '@/components/candidate/OrderSummary';
import { AuthPanel, AuthShell } from '@/components/auth/AuthShell';
import { getSiteSettings } from '@/lib/cms/data';
import { siteText } from '@/lib/cms/localize';
import { FilmButton } from '@/components/cms/VideoPlayer';
import { fill, getDictionary, isLocale, localePath } from '@/lib/i18n';
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
  const { company, pricing, applications, general } = await getSiteSettings();

  /* Position carried over from the landing page's selector. */
  const initialPosition: PositionSlug = positionBySlug(query.position ?? '')
    ? (query.position as PositionSlug)
    : POSITIONS[0].slug;

  return (
    <AuthShell
      header={
        <>
          <Wordmark href={localePath(locale, '/')} />
          <p className="m-0 text-[14px] text-ink-2">
            <Link href={localePath(locale, '/contact')} className="prose-link">
              {fill(t.signup.help, { phone: company.phone })}
            </Link>
          </p>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[clamp(20px,3cqi,28px)] lg:flex-row lg:items-start">
        <AuthPanel className="min-w-0 flex-1">
          <SignupFlow
            locale={locale}
            t={t}
            initialPosition={initialPosition}
            entity={{
              statementDescriptor: company.statementDescriptor,
              tradingAs: company.tradingAs,
              legalName: company.legalName,
            }}
          />
        </AuthPanel>
        <div className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
          <OrderSummary t={t} pricing={pricing} company={company} whatsapp={general.whatsapp} />
          {applications.filmUrl && applications.filmLabel ? (
            <div className="flex justify-center">
              <FilmButton src={applications.filmUrl} label={siteText(locale, applications.filmLabel)} />
            </div>
          ) : null}
        </div>
      </div>
    </AuthShell>
  );
}
