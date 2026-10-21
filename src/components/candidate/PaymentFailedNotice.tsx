import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';

/** Shown when checkout is cancelled or the bank declines, before they try again. */
export function PaymentFailedNotice({ locale, whatsapp }: { locale: Locale; whatsapp: string }) {
  const t = (english: string) => siteText(locale, english);
  const digits = whatsapp.replace(/[^\d]/g, '');
  const help =
    locale === 'hi'
      ? 'नमस्ते, मेरी रिपोर्ट का भुगतान पूरा नहीं हुआ। मदद चाहिए।'
      : 'Hello, my report payment did not go through. I need help.';

  return (
    <section
      id="payment-failed"
      className="mb-6 scroll-mt-24 rounded-[20px] border border-accent bg-accent-tint p-[clamp(18px,2.5cqi,24px)]"
    >
      <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">{t('Payment did not go through')}</h2>
      <p className="m-0 mt-2 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
        {t(
          'Nothing was charged. If you use UPI, open the prices below and choose UPI. If your card was declined, turn on international online payments in your bank app, or pay by UPI instead.',
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <a
          href="#package"
          className="t-colors inline-flex rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-paper no-underline hover:bg-ink-hover"
        >
          {t('Try again')}
        </a>
        {digits ? (
          <a
            href={`https://wa.me/${digits}?text=${encodeURIComponent(help)}`}
            target="_blank"
            rel="noreferrer"
            className="t-colors inline-flex rounded-full border border-line-strong bg-surface px-4 py-2.5 text-[14px] font-medium text-ink no-underline hover:border-ink"
          >
            {t('WhatsApp help')}
          </a>
        ) : null}
      </div>
    </section>
  );
}
