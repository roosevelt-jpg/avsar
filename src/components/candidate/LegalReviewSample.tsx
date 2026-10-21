import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';

/**
 * Shows the shape of a preliminary legal review before payment.
 * The name is removed and the facts are an example, not this candidate's file.
 */
export function LegalReviewSample({ locale }: { locale: Locale }) {
  const t = (english: string) => siteText(locale, english);
  const rows = [
    ['Summary', 'Passport is in date. The police clearance certificate is not in the file.'],
    [
      'What a Portuguese work visa needs',
      'A valid passport, a police clearance certificate, the job contract, and proof of the qualifications the role asks for.',
    ],
    ['Still missing', 'Police clearance certificate.'],
    [
      'Needs a closer look',
      'An earlier visa refusal was mentioned. The lawyers need that refusal letter before they can say how it affects this application.',
    ],
  ] as const;

  return (
    <section className="mb-8 rounded-[20px] border border-line bg-surface p-[clamp(18px,2.5cqi,28px)]">
      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-accent-deep">{t('Sample, not your file')}</p>
      <h2 className="mt-2 mb-2 text-[clamp(20px,2.6cqi,26px)] font-semibold leading-[1.15]">
        {t('What the preliminary legal review looks like')}
      </h2>
      <p className="m-0 max-w-[62ch] text-[14px] leading-[1.6] text-ink-2">
        {t(
          'This is an example with the name removed. It is not a review of your documents, not permission to work, and not a visa decision. Your own review is written after you buy the package and upload your passport or ID.',
        )}
      </p>
      <dl className="m-0 mt-5 flex flex-col gap-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[14px] font-semibold text-ink">{t(label)}</dt>
            <dd className="m-0 mt-1 text-[14px] leading-[1.55] text-ink-2">{t(value)}</dd>
          </div>
        ))}
      </dl>
      <a href="#package" className="prose-link mt-4 inline-block text-[14px]">
        {t('Get this review of your own documents')}
      </a>
    </section>
  );
}
