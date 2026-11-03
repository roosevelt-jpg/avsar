import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { Icon } from '@/components/cms/primitives';
import { MarketingEyebrow } from '@/components/marketing/MarketingEyebrow';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';

const JOURNEY = [
  { title: 'Create your profile', body: 'Tell us who you are, your skills and experience.' },
  { title: 'Complete the skills test', body: 'Show your abilities. The test is free.' },
  { title: 'Get reviewed', body: 'Our team reviews your profile against real roles.' },
  { title: 'Apply and get hired', body: 'Apply to jobs that fit you and start relocation after an offer.' },
] as const;

/**
 * Signup layout matched to the registration mockup: navy hero, journey rail,
 * and a white form card. Keeps SignupFlow logic untouched.
 */
export function SignupMarketingShell({
  locale,
  children,
  helpPhone,
}: {
  locale: Locale;
  children: React.ReactNode;
  helpPhone: string;
}) {
  const t = (english: string) => siteText(locale, english);

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        <section className="relative overflow-hidden bg-[#0a088f] text-white">
          <Image
            src="/photos/brand/hero-hospitality.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0a088f] via-[#0a088f]/88 to-[#0a088f]/45" />
          <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-8 px-[clamp(20px,4cqi,56px)] py-[clamp(40px,6cqi,72px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <MarketingEyebrow>{t('Candidate registration')}</MarketingEyebrow>
              <h1 className="display-serif m-0 mt-4 text-balance text-[clamp(32px,4.8cqi,52px)] font-normal leading-[1.08]">
                {t('Create your Portugal career profile')}
              </h1>
              <p className="m-0 mt-5 max-w-[46ch] text-[clamp(15px,1.6cqi,18px)] leading-[1.55] text-white/88">
                {t('Free to start. Verified jobs, a written contract, and visa support after a successful offer — not before.')}
              </p>
              <ul className="m-0 mt-8 flex list-none flex-wrap gap-x-6 gap-y-3 p-0 text-[13px] font-medium text-white/95">
                {[t('Apply for verified jobs'), t('Matched to employers'), t('Visa and relocation support')].map((label) => (
                  <li key={label} className="inline-flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-full border border-[var(--color-gold)]/55 text-[var(--color-gold)]">
                      <Icon name="check" className="size-3.5" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-6 text-[14px] text-white/75">
                <Link href={localePath(locale, '/contact')} className="text-[var(--color-gold)] no-underline hover:underline">
                  {t('Need help?')}
                </Link>{' '}
                <span dir="ltr">{helpPhone}</span>
              </p>
            </div>
            <div className="relative hidden min-h-[320px] overflow-hidden rounded-[18px] lg:block">
              <Image src="/photos/brand/hero-workers.jpg" alt="" fill sizes="40vw" className="object-cover" />
            </div>
          </div>
        </section>

        <section className="bg-ivory px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,8cqi,96px)] pt-0">
          <div className="relative mx-auto -mt-10 grid w-full max-w-[1100px] overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_24px_50px_-28px_rgba(10,8,143,0.4)] lg:-mt-14 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="border-b border-line bg-[#0a088f] p-6 text-white lg:border-b-0 lg:border-e">
              <h2 className="display-serif m-0 text-[22px] font-normal">{t('Your journey to Portugal')}</h2>
              <ol className="m-0 mt-6 flex list-none flex-col gap-5 p-0">
                {JOURNEY.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--color-gold)] text-[12px] font-semibold text-[var(--color-gold)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="m-0 text-[14px] font-semibold">{t(step.title)}</p>
                      <p className="m-0 mt-1 text-[13px] leading-[1.45] text-white/75">{t(step.body)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="relative mt-8 hidden aspect-[4/3] overflow-hidden rounded-[12px] lg:block">
                <Image src="/photos/brand/journey-tram.jpg" alt="" fill sizes="280px" className="object-cover" />
              </div>
            </aside>
            <div className="min-w-0 p-[clamp(20px,3cqi,36px)]">{children}</div>
          </div>
        </section>
      </main>
    </>
  );
}
