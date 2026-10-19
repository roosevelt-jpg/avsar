import Link from 'next/link';
import { getSiteSettings } from '@/lib/cms/data';

/**
 * The site logo: the mark, then the site name from Settings › General.
 *
 * Two points joined by a dotted route: a filled terracotta dot for India, where
 * the candidate is, and an open ink ring for Europe, where the job is. It
 * replaced a plain coloured circle that stood in until a real mark existed.
 *
 * The props are unchanged from that placeholder, deliberately. Eleven call
 * sites already said which of the two things that matter was true, a dark
 * background and the employer side, so the new mark reads them rather than
 * making every header change at once.
 */

function BrandMark({
  size,
  tone,
}: {
  size: number;
  tone: 'light' | 'dark';
  accent: 'candidate' | 'employer';
}) {
  /* The ring and route follow the text colour, so the mark switches with the
     theme and with dark bands without a second set of colours. */
  const ink = 'currentColor';
  /* Terracotta everywhere, the employer side included: the logo is one mark,
     not a colour code. Lifted on dark so it does not go muddy against the
     ink background. `accent` is still accepted, and no longer recolours it. */
  const origin = tone === 'dark' ? '#C96A4B' : '#B9583A';

  return (
    <svg
      width={Math.round(size * 1.75)}
      height={size}
      viewBox="0 0 112 64"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M20 44 C 34 4, 78 4, 92 44"
        fill="none"
        stroke={ink}
        strokeWidth={3}
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      <circle cx={20} cy={44} r={16} fill={origin} />
      <circle cx={92} cy={44} r={15} fill="none" stroke={ink} strokeWidth={4} />
      <circle cx={92} cy={44} r={6} fill={ink} />
    </svg>
  );
}

export async function Wordmark({
  href,
  suffix,
  tone = 'light',
  accent = 'candidate',
  /** 28 in a page header, 22 where the header is compact. */
  size = 28,
}: {
  href?: string;
  suffix?: string;
  tone?: 'light' | 'dark';
  accent?: 'candidate' | 'employer';
  size?: number;
}) {
  const settings = await getSiteSettings();
  const name = settings.general.siteName;
  /* The short name is set in bold and the rest of the name follows it in a
     lighter weight, when the site name starts with it. */
  const short = settings.company.shortName && name.startsWith(settings.company.shortName) ? settings.company.shortName : name;
  const rest = name.slice(short.length).trim();
  const inner = (
    /*
      Pinned to `ltr`, inside an Arabic page that is `rtl`.

      Flex children reverse under `dir="rtl"`, which turned the mark into
      "Recruitment S&A" and put the logo on the wrong side of it. A company name
      is not a sentence: it does not translate and it does not reverse. The
      surrounding page still flips, and this one object does not.
    */
    <span
      dir="ltr"
      aria-label={name}
      className={`flex flex-wrap items-center gap-x-2.5 gap-y-0.5 ${
        tone === 'dark' ? 'text-on-night' : 'text-ink'
      }`}
    >
      <BrandMark size={size} tone={tone} accent={accent} />

      {/* Baseline-aligned rather than centred, so the two words sit on one line of type. */}
      <span
        className="flex items-baseline gap-1.5 font-semibold tracking-[-0.02em]"
        style={{ fontSize: size * 0.72 }}
      >
        {short}
        {rest ? (
          <span
            className={`font-medium tracking-normal ${
              tone === 'dark' ? 'text-dark-muted' : 'text-muted'
            }`}
          >
            {rest}
          </span>
        ) : null}
      </span>

      {suffix ? (
        <span
          className={`text-[0.7em] font-medium ${
            tone === 'dark' ? 'text-dark-muted' : 'text-muted'
          }`}
          style={{ fontSize: size * 0.5 }}
        >
          {suffix}
        </span>
      ) : null}
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="no-underline">
      {inner}
    </Link>
  );
}
