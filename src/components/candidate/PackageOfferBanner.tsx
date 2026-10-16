import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import { siteText } from '@/lib/cms/localize';
import type { ConversionSettings } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n';

/** Shown once after the last assessment section, when ?offer=1 is on the URL. */
export function PackageOfferBanner({
  locale,
  conversion,
  fee,
}: {
  locale: Locale;
  conversion: ConversionSettings;
  fee: string;
}) {
  const t = (english: string) => siteText(locale, english);
  return (
    <section
      id="package-offer"
      className="mb-8 rounded-[24px] border border-ink bg-ink p-[clamp(20px,3cqi,32px)] text-paper"
    >
      <Mono className="text-dark-muted">{t('Assessment complete')}</Mono>
      <h2 className="mt-2.5 mb-2 text-[clamp(22px,2.8cqi,28px)] font-semibold leading-[1.15] tracking-[-0.02em]">
        {t(conversion.offerHeading)}
      </h2>
      <p className="m-0 max-w-[62ch] text-[15px] leading-[1.6] text-dark-muted-2">{t(conversion.offerBody)}</p>
      <p className="mt-3 mb-0 text-[14px] text-dark-muted">
        {t('Package price')}: {fee}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href="#package"
          className="t-colors inline-flex rounded-full bg-paper px-5 py-3 text-[15px] font-semibold text-ink no-underline hover:bg-surface"
        >
          {t(conversion.offerPrimaryLabel)}
        </a>
        <Link
          href={localePath(locale, '/jobs')}
          className="t-colors inline-flex rounded-full border border-dark-line px-5 py-3 text-[15px] font-semibold text-paper no-underline hover:border-on-night"
        >
          {t(conversion.offerSecondaryLabel)}
        </Link>
      </div>
    </section>
  );
}
