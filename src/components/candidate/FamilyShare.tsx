'use client';

import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';

/**
 * Forwards the family page on WhatsApp, and plays a recording only when
 * staff have put one in Settings. A missing file stays silent: a generated
 * voice would pretend someone on the team had spoken.
 */
export function FamilyShare({
  locale,
  shareUrl,
  voiceUrl,
}: {
  locale: Locale;
  shareUrl: string;
  voiceUrl: string;
}) {
  const message = `${siteText(locale, 'Hello, please read this before anyone pays. Joining is free. A job and a visa are not for sale.')} ${shareUrl}`;
  const href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const audio = voiceUrl.startsWith('https://') || voiceUrl.startsWith('/') ? voiceUrl : '';

  return (
    <div className="flex flex-col items-start gap-4">
      {audio ? (
        <div className="w-full max-w-[440px]">
          <p className="m-0 mb-2 text-[14px] leading-[1.5] text-ink-2">{siteText(locale, 'Listen, about 30 seconds')}</p>
          <audio controls preload="none" src={audio} className="w-full" />
        </div>
      ) : null}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="t-colors inline-flex items-center rounded-[12px] bg-ink px-5 py-3 text-[15px] font-medium text-paper no-underline hover:bg-ink-hover"
      >
        {siteText(locale, 'Send this to my family')}
      </a>
    </div>
  );
}
