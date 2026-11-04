import Image from 'next/image';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { Icon } from '@/components/cms/primitives';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';

const HERO = {
  src: '/photos/brand/hero-hospitality.jpg',
  alt: 'A professional ready for a career in Portugal',
} as const;

const BENEFITS = [
  'Apply for Verified Jobs',
  'Get Matched to Employers',
  'Relocation & Visa Support',
] as const;

const JOURNEY = [
  {
    icon: 'users' as const,
    title: 'Create Your Profile',
    body: 'Tell us about yourself, skills and experience.',
  },
  {
    icon: 'document' as const,
    title: 'Complete Skills Test',
    body: 'Showcase your abilities (optional but recommended).',
  },
  {
    icon: 'shield' as const,
    title: 'Get Verified',
    body: 'Our team reviews and verifies your profile.',
  },
  {
    icon: 'briefcase' as const,
    title: 'Apply & Get Hired',
    body: 'Apply for suitable jobs and start your relocation journey.',
  },
] as const;

/**
 * Candidate registration shell matching the Create Your Portugal Career Profile
 * mockup: overlay hero, light journey rail, overlapping white form card.
 */
export function SignupMarketingShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
  helpPhone?: string;
  filmUrl?: string;
  filmLabel?: string;
}) {
  const t = (english: string) => siteText(locale, english);

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        <section className="relative isolate min-h-[min(58vh,520px)] overflow-hidden bg-[#142438] text-white">
          <div className="absolute inset-0" aria-hidden>
            <Image
              src={HERO.src}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_28%]"
            />
            <div className="absolute inset-0 bg-[#142438]/55" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#142438]/92 via-[#142438]/72 to-[#142438]/25" />
          </div>
          <div className="relative mx-auto flex w-full max-w-[1200px] flex-col justify-center px-[clamp(20px,4cqi,56px)] pb-[clamp(88px,12cqi,140px)] pt-[clamp(40px,6cqi,72px)]">
            <div className="max-w-[640px]">
              <p className="eyebrow-gold m-0">{t('Candidate Registration')}</p>
              <h1 className="display-serif m-0 mt-4 text-balance text-[clamp(34px,5cqi,56px)] font-normal leading-[1.08]">
                {t('Create Your Candidate Profile')}
              </h1>
              <p className="m-0 mt-5 max-w-[48ch] text-[clamp(15px,1.6cqi,18px)] leading-[1.55] text-white/88">
                {t(
                  'Take the first step towards a rewarding career in Portugal. It’s free, simple, and opens the door to verified job opportunities.',
                )}
              </p>
              <ul className="m-0 mt-8 flex list-none flex-wrap gap-x-7 gap-y-3 p-0 text-[13px] font-medium text-white/95">
                {BENEFITS.map((item) => (
                  <li key={item} className="inline-flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-full border border-[var(--color-gold)]/60 text-[var(--color-gold)]">
                      <Icon name="check" className="size-3.5" />
                    </span>
                    {t(item)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-[#f5f6f8] px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,8cqi,96px)] pt-0">
          <div className="relative mx-auto -mt-[clamp(48px,8cqi,88px)] grid w-full max-w-[1100px] overflow-hidden rounded-[18px] border border-[#142438]/08 bg-white shadow-[0_28px_60px_-28px_rgba(20,36,56,0.45)] lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
            <aside className="border-b border-line bg-[#f7f4ef] p-6 lg:border-b-0 lg:border-e lg:border-line">
              <h2 className="display-serif m-0 text-[22px] font-normal text-[#142438]">
                {t('Your Journey to Portugal')}
              </h2>
              <ol className="relative m-0 mt-7 flex list-none flex-col gap-0 p-0">
                {JOURNEY.map((step, index) => (
                  <li key={step.title} className="relative flex gap-3.5 pb-7 last:pb-0">
                    {index < JOURNEY.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute start-[15px] top-9 bottom-0 w-px border-s border-dashed border-[var(--color-gold)]/70"
                      />
                    ) : null}
                    <span className="relative z-[1] grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-gold)] text-[12px] font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="m-0 flex items-center gap-2 text-[14px] font-semibold text-[#142438]">
                        <Icon name={step.icon} className="size-4 text-[var(--color-gold)]" />
                        {t(step.title)}
                      </p>
                      <p className="m-0 mt-1 text-[13px] leading-[1.45] text-ink-2">{t(step.body)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="relative mt-4 hidden aspect-[5/4] overflow-hidden rounded-[14px] bg-[#142438] lg:block">
                <Image
                  src="/photos/brand/journey-tram.jpg"
                  alt={t('A yellow Lisbon tram on a historic street')}
                  fill
                  sizes="280px"
                  className="object-cover"
                />
              </div>
            </aside>
            <div className="min-w-0 p-[clamp(22px,3.2cqi,40px)]">{children}</div>
          </div>
        </section>
      </main>
    </>
  );
}
