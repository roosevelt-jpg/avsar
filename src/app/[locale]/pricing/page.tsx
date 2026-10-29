import Link from 'next/link';
import { staticPageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { FaqAccordion } from '@/components/candidate/FaqAccordion';
import { PackagePaywallCopy } from '@/components/candidate/PackagePaywallCopy';
import { CandidateStoriesBlock } from '@/components/cms/blocks/Media';
import { fill, isLocale, localePath } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/cms/data';
import { formatFee, formatMoney, formatProductFee } from '@/lib/company/config';
import { siteText } from '@/lib/cms/localize';
import { getSessionCandidate } from '@/lib/auth';
import { getCandidateStatus } from '@/lib/candidate/status';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return staticPageMetadata('pricing', locale);
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const settings = await getSiteSettings();
  const { pricing, hiring, conversion } = settings;
  const tx = (english: string) => siteText(locale, english);

  const candidate = await getSessionCandidate();
  const status = candidate ? await getCandidateStatus(candidate.id, candidate.paymentStatus) : null;
  const candidateCta =
    status?.awaitingPayment
      ? { label: tx(conversion.offerPrimaryLabel), href: localePath(locale, '/dashboard#package') }
      : status?.assessmentComplete && status.paid
        ? { label: tx('Go to your dashboard'), href: localePath(locale, '/dashboard') }
        : { label: tx(conversion.pricingStartCta), href: localePath(locale, '/signup') };

  const shortlistLabel = `${(hiring.shortlistMinScore / 10).toFixed(hiring.shortlistMinScore % 10 === 0 ? 0 : 1)} out of 10`;
  const skills = formatProductFee(pricing, 'skills_report');
  const visa = formatProductFee(pricing, 'visa_requirements');
  const bundle = formatProductFee(pricing, 'bundle');
  const separate = formatFee(pricing);

  const plans = [
    {
      eyebrow: tx(conversion.candidateEyebrow),
      price: bundle,
      period: tx(conversion.candidatePeriod),
      note: `${tx('Skills report')} ${skills}. ${tx('Visa requirements')} ${visa}. ${tx('Bought separately')} ${separate}.`,
      features: conversion.pricingFeatures.map(tx),
      cta: candidateCta,
      dark: true,
      showPaywall: true as const,
    },
    {
      eyebrow: tx(conversion.employerEyebrow),
      price: formatMoney(pricing.employerPlacementFeeMinor, 'EUR'),
      period: tx(conversion.employerPeriod),
      note: tx(conversion.employerNote),
      features: conversion.employerFeatures.map(tx),
      cta: { label: tx(conversion.bookCall), href: '/employers#contact' },
      dark: false,
      showPaywall: false as const,
    },
    {
      eyebrow: tx(conversion.partnerEyebrow),
      price: tx(conversion.partnerPrice),
      period: '',
      note: tx(conversion.partnerNote),
      features: conversion.partnerFeatures.map(tx),
      cta: { label: tx(conversion.contactSales), href: '/employers#contact' },
      dark: false,
      showPaywall: false as const,
    },
  ];

  const faq = conversion.pricingFaq.map(
    (item) => [tx(item.question), fill(tx(item.answer), { skills, visa, bundle, separate })] as const,
  );

  return (
    <>
      <SiteHeader locale={locale} />

      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(48px,7cqi,96px)]">
        <h1 className="m-0 text-[clamp(32px,5cqi,60px)] font-semibold leading-[1.05] tracking-[-0.035em]">
          {tx(conversion.pricingTitle)}
        </h1>
        <p className="mt-4 mb-10 max-w-[56ch] text-[clamp(16px,1.8cqi,19px)] leading-[1.55] text-ink-2">
          {tx(conversion.pricingLead)}
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
                    ? 'bg-paper text-ink hover:bg-surface'
                    : 'border border-line-strong bg-surface text-ink hover:border-ink'
                }`}
              >
                {plan.cta.label}
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-10 rounded-[24px] border border-line bg-surface p-[clamp(20px,3cqi,32px)]">
          <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">{tx(conversion.reportsHeading)}</h2>
          <PackagePaywallCopy
            locale={locale}
            conversion={conversion}
            hiring={hiring}
            shortlistLabel={shortlistLabel}
          />
        </section>

        <div className="mt-12">
          <CandidateStoriesBlock
            locale={locale}
            data={{
              eyebrow: conversion.storiesEyebrow,
              title: conversion.storiesTitle,
              intro: conversion.storiesIntro,
              limit: 3,
            }}
          />
        </div>

        <section className="mt-[clamp(48px,7cqi,96px)] max-w-[840px]">
          <h2 className="m-0 mb-7 text-[clamp(26px,3.6cqi,44px)] font-semibold leading-[1.1] tracking-[-0.03em]">
            {tx(conversion.pricingQuestions)}
          </h2>
          <FaqAccordion items={faq} />
        </section>
      </main>
    </>
  );
}
