import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import { FaqAccordion } from '@/components/candidate/FaqAccordion';
import { fill, getDictionary, isLocale } from '@/lib/i18n';
import { EMPLOYER_PRICE_EUR, activePrice, formatPrice } from '@/lib/data/cohort';
import { formatIndicative } from '@/lib/data/brand';

export const metadata = { title: 'Pricing' };

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const p = t.pricing;

  const plans = [
    {
      eyebrow: p.candidates,
      price: formatIndicative(),
      period: p.candidatesPeriod,
      /*
        The rupee is the headline and the euro is the charge, so the euro is
        said here rather than left to the checkout. A price page that quotes one
        currency and a checkout that takes another is the complaint this line
        exists to prevent.
      */
      note: `${p.candidatesNote} ${fill(t.feeIndicative, { charged: formatPrice(activePrice().totalMinor) })}`,
      features: p.candidatesFeatures,
      cta: { label: p.startCta, href: `/${locale}/signup` },
      dark: true,
    },
    {
      eyebrow: p.employers,
      price: `€${EMPLOYER_PRICE_EUR.toLocaleString('en-GB')}`,
      period: p.employersPeriod,
      note: p.employersNote,
      features: p.employersFeatures,
      cta: { label: p.bookCall, href: '/employers#contact' },
      dark: false,
    },
    {
      eyebrow: p.partner,
      price: p.partnerPrice,
      period: '',
      note: p.partnerNote,
      features: p.partnerFeatures,
      cta: { label: p.contactSales, href: '/employers#contact' },
      dark: false,
    },
  ];

  return (
    <>
      <SiteHeader locale={locale} />

      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(48px,7cqi,96px)]">
        <h1 className="m-0 text-[clamp(32px,5cqi,60px)] font-semibold leading-[1.05] tracking-[-0.035em]">
          {p.title}
        </h1>
        <p className="mt-4 mb-10 max-w-[56ch] text-[clamp(16px,1.8cqi,19px)] leading-[1.55] text-ink-2">
          {p.lead}
        </p>

        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 p-0">
          {plans.map((plan) => (
            <li
              key={plan.eyebrow}
              className={`flex flex-col rounded-[20px] border p-[clamp(22px,2.6cqi,30px)] ${
                plan.dark ? 'border-ink bg-ink text-paper' : 'border-line bg-surface'
              }`}
            >
              <Mono className={plan.dark ? 'text-dark-muted' : 'text-muted'}>{plan.eyebrow}</Mono>
              <p className="mt-4 mb-1 text-[38px] font-semibold leading-none tracking-[-0.03em]">
                {plan.price}
                {plan.period ? (
                  <span
                    className={`ml-2 text-[14px] font-normal ${plan.dark ? 'text-dark-muted' : 'text-muted'}`}
                  >
                    {plan.period}
                  </span>
                ) : null}
              </p>
              <p className={`m-0 mb-6 text-[13px] leading-[1.5] ${plan.dark ? 'text-dark-muted-2' : 'text-muted'}`}>
                {plan.note}
              </p>

              <ul className="m-0 mb-7 flex flex-1 list-none flex-col gap-2.5 p-0">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[14px] leading-[1.5]">
                    <span aria-hidden className={plan.dark ? 'text-success' : 'text-accent-deep'}>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={`t-colors rounded-[10px] px-4 py-2.5 text-center text-[14px] font-medium no-underline ${
                  plan.dark
                    ? 'bg-paper text-ink hover:bg-white'
                    : 'border border-line-strong bg-surface text-ink hover:border-ink'
                }`}
              >
                {plan.cta.label}
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-[clamp(48px,7cqi,96px)] max-w-[840px]">
          <h2 className="m-0 mb-7 text-[clamp(26px,3.6cqi,44px)] font-semibold leading-[1.1] tracking-[-0.03em]">
            {p.questions}
          </h2>
          <FaqAccordion items={p.faq} />
        </section>
      </main>

      <SiteFooter locale={locale} />
    </>
  );
}
