import Link from 'next/link';
import { BRAND } from '@/lib/data/brand';

/**
 * The S&A Recruitment logo.
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

const INK = { light: '#1B1A17', dark: '#F7F5F0' } as const;

function BrandMark({
  size,
  tone,
  accent,
}: {
  size: number;
  tone: 'light' | 'dark';
  accent: 'candidate' | 'employer';
}) {
  const ink = INK[tone];
  /* The employer side is blue, and the candidate side is terracotta, lifted on
     dark so it does not go muddy against the ink background. */
  const origin = accent === 'employer' ? '#3C6FB0' : tone === 'dark' ? '#C96A4B' : '#B9583A';

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

export function Wordmark({
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
      aria-label={BRAND.name}
      className={`flex flex-wrap items-center gap-x-2.5 gap-y-0.5 ${
        tone === 'dark' ? 'text-paper' : 'text-ink'
      }`}
    >
      <BrandMark size={size} tone={tone} accent={accent} />

      {/* "S&A" bold, "Recruitment" lighter and quieter. Baseline-aligned rather
          than centred, so the two words sit on one line of type. */}
      <span
        className="flex items-baseline gap-1.5 font-semibold tracking-[-0.02em]"
        style={{ fontSize: size * 0.72 }}
      >
        {BRAND.shortName}
        <span
          className={`font-medium tracking-normal ${
            tone === 'dark' ? 'text-dark-muted' : 'text-muted'
          }`}
        >
          Recruitment
        </span>
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
