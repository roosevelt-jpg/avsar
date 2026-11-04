import Link from 'next/link';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { getSiteSettings } from '@/lib/cms/data';

/**
 * Site logo for headers: BrandLogo SVG plus an optional accessible name.
 *
 * The visible mark is the reconstructed S&A wordmark. Settings › General still
 * supplies the aria-label so a renamed brand stays announced correctly without
 * inventing a second logo from a screenshot.
 */

export async function Wordmark({
  href,
  suffix,
  tone = 'light',
  accent: _accent = 'candidate',
  /** Same mark size in the marketing header and footer. */
  size = 40,
}: {
  href?: string;
  suffix?: string;
  tone?: 'light' | 'dark';
  accent?: 'candidate' | 'employer';
  size?: number;
}) {
  const settings = await getSiteSettings();
  const name = settings.general.siteName;
  void _accent;

  const inner = (
    <span
      dir="ltr"
      aria-label={suffix ? `${name} ${suffix}` : name}
      className={`inline-flex flex-wrap items-center gap-x-2.5 gap-y-0.5 ${
        tone === 'dark' ? 'text-on-night' : 'text-ink'
      }`}
    >
      <BrandLogo size={size} tone={tone} />
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
