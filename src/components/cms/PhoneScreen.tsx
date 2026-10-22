import Link from 'next/link';
import { AuthPanel, AuthShell } from '@/components/auth/AuthShell';
import { OrderSummary } from '@/components/candidate/OrderSummary';
import { SignupFlow } from '@/components/candidate/SignupFlow';
import { AssessmentRunner } from '@/components/candidate/AssessmentRunner';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { FilmButton } from '@/components/cms/VideoPlayer';
import { JobCard } from '@/components/jobs/JobCard';
import { Mono } from '@/components/ui/Mono';
import { Wordmark } from '@/components/ui/Wordmark';
import { getSiteSettings } from '@/lib/cms/data';
import { siteText, localizeJob } from '@/lib/cms/localize';
import type { ShopPhone } from '@/lib/cms/scenes';
import { formatFee, formatMoney, formatProductFee } from '@/lib/company/config';
import { AREAS, POSITIONS } from '@/lib/data/positions';
import { itemsForSection, toClientItem } from '@/lib/assessment/items';
import { listPublishedJobs } from '@/lib/jobs/data';
import { fill, getDictionary, localePath } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

/**
 * A phone showing one real page, at a phone width, clipped to the glass.
 *
 * The photographs had a blank or generic screen. These are the same pages a
 * candidate opens on their phone: the account form, the test, the job board
 * and the price. The frame does not take clicks, so it cannot submit the form.
 */
export async function PhoneScreen({ screen, locale }: { screen: ShopPhone; locale: Locale }) {
  return (
    <div className="phone-shot" inert aria-hidden>
      <div className="phone-bezel">
        <div className="phone-notch" />
        <div className="phone-viewport">
          <div className="phone-page">
            {screen === 'signup' ? <SignupPhone locale={locale} /> : null}
            {screen === 'assessment' ? <AssessmentPhone locale={locale} /> : null}
            {screen === 'jobs' ? <JobsPhone locale={locale} /> : null}
            {screen === 'pricing' ? <PricingPhone locale={locale} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

async function SignupPhone({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const { company, applications, general } = await getSiteSettings();
  const initialPosition = POSITIONS[0]?.slug;
  if (!initialPosition) return null;

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
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-[clamp(20px,3cqi,28px)]">
        <AuthPanel className="min-w-0 flex-1">
          <SignupFlow locale={locale} t={t} initialPosition={initialPosition} />
        </AuthPanel>
        <div className="flex w-full flex-col gap-4">
          <OrderSummary locale={locale} company={company} whatsapp={general.whatsapp} />
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

function AssessmentPhone({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  /* English items have no answer key on the client. Four is enough to show
     the counter and the progress bar the way the test actually looks. */
  const items = itemsForSection('english', 'hospitality', 'shopfront-phone')
    .slice(0, 4)
    .map((item) => toClientItem(item, 'shopfront-phone', locale));

  return (
    <AssessmentRunner
      locale={locale}
      t={t}
      items={items}
      currentSection="english"
      attemptId={null}
      secondsRemaining={90 * 60}
      savedAnswers={{}}
      preview
    />
  );
}

async function JobsPhone({ locale }: { locale: Locale }) {
  const result = await listPublishedJobs({ page: 1, pageSize: 2 });
  const tx = (english: string) => siteText(locale, english);

  return (
    <>
      <SiteHeader locale={locale} compact />
      <section className="px-5 pb-10 pt-5">
        <form method="get" action={localePath(locale, '/jobs')} className="grid grid-cols-1 gap-3 rounded-[22px] border border-line bg-surface p-3">
          <label className="sr-only" htmlFor="phone-job-q">
            {tx('Search jobs')}
          </label>
          <input
            id="phone-job-q"
            name="q"
            placeholder={tx('Job title, skill or city')}
            className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[16px] outline-none"
          />
          <label className="sr-only" htmlFor="phone-job-position">
            {tx('Role')}
          </label>
          <select id="phone-job-position" name="position" defaultValue="" className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[16px]">
            <option value="">{tx('All roles')}</option>
            {AREAS.map((area) => (
              <optgroup key={area.slug} label={tx(area.label)}>
                {POSITIONS.filter((position) => position.area === area.slug).map((position) => (
                  <option key={position.slug} value={position.slug}>
                    {tx(position.label)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button type="submit" className="rounded-[14px] border-0 bg-ink px-6 py-3 text-[16px] font-medium text-paper">
            {tx('Search')}
          </button>
        </form>
        <p className="mt-6 mb-4 text-[15px] text-ink-2">
          <strong className="text-ink">{result.total}</strong> {tx(result.total === 1 ? 'open job' : 'open jobs')}
        </p>
        {result.jobs.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-line-strong bg-surface px-5 py-10 text-center">
            <p className="m-0 text-[18px] font-semibold">{tx('No jobs match this search right now.')}</p>
            <p className="m-0 mt-2 text-[15px] text-ink-2">
              {tx('Try another role or city, or create your profile and we will tell you when one opens.')}
            </p>
          </div>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0">
            {result.jobs.map((job) => (
              <li key={job.id}>
                <JobCard job={localizeJob(job, locale)} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

async function PricingPhone({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const { pricing, conversion } = await getSiteSettings();
  const tx = (english: string) => siteText(locale, english);
  const skills = formatProductFee(pricing, 'skills_report');
  const visa = formatProductFee(pricing, 'visa_requirements');
  const bundle = formatProductFee(pricing, 'bundle');
  const separate = formatFee(pricing);

  return (
    <>
      <SiteHeader locale={locale} compact />
      <main className="px-5 py-8">
        <h1 className="m-0 text-[32px] font-semibold leading-[1.05] tracking-[-0.035em]">{t.pricing.title}</h1>
        <p className="mt-4 mb-8 text-[16px] leading-[1.55] text-ink-2">{tx(conversion.pricingLead)}</p>
        <article className="flex flex-col rounded-[20px] border border-ink bg-ink p-6 text-paper">
          <Mono className="text-dark-muted">{t.pricing.candidates}</Mono>
          <p className="mt-4 mb-1 text-[38px] font-semibold leading-none tracking-[-0.03em]">
            {bundle}
            <span className="ml-2 text-[14px] font-normal text-dark-muted">{tx('both together')}</span>
          </p>
          <p className="m-0 mb-6 text-[13px] leading-[1.5] text-dark-muted-2">
            {tx('Skills report')} {skills}. {tx('Visa requirements')} {visa}. {tx('Bought separately')} {separate}.
          </p>
          <ul className="m-0 mb-7 flex list-none flex-col gap-2.5 p-0">
            {conversion.pricingFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[14px] leading-[1.5]">
                <span aria-hidden className="text-success">
                  ✓
                </span>
                {tx(feature)}
              </li>
            ))}
          </ul>
          <p className="m-0 text-[13px] text-dark-muted-2">
            {tx('Employers pay')} {formatMoney(pricing.employerPlacementFeeMinor, 'EUR')} {t.pricing.employersPeriod}.
          </p>
        </article>
      </main>
    </>
  );
}
