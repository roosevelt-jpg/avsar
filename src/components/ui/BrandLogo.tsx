/**
 * Original S&A wordmark for marketing chrome.
 *
 * Reconstructed as SVG (not a screenshot): stacked “S&A” / RECRUITMENT with a
 * gold rule and SMITH & ADAMS underneath. Colours follow the tone prop so the
 * same mark works on the navy shop header and on light paper.
 */

export function BrandLogo({
  size = 28,
  tone = 'light',
  className = '',
}: {
  size?: number;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const ink = tone === 'dark' ? '#f4f8fb' : '#0a088f';
  const muted = tone === 'dark' ? 'rgba(244, 248, 251, 0.72)' : '#5c7084';
  const gold = '#c9a54a';
  const height = size;
  const width = Math.round(size * 4.15);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 232 56"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      <text
        x="0"
        y="28"
        fill={ink}
        fontFamily="var(--font-dm-serif), 'Times New Roman', serif"
        fontSize="30"
        fontWeight="400"
        letterSpacing="-0.5"
      >
        S&amp;A
      </text>
      <text
        x="72"
        y="16"
        fill={ink}
        fontFamily="var(--font-schibsted), system-ui, sans-serif"
        fontSize="11"
        fontWeight="700"
        letterSpacing="2.4"
      >
        RECRUITMENT
      </text>
      <line x1="72" y1="24" x2="220" y2="24" stroke={gold} strokeWidth="1.5" />
      <text
        x="72"
        y="40"
        fill={muted}
        fontFamily="var(--font-schibsted), system-ui, sans-serif"
        fontSize="9"
        fontWeight="600"
        letterSpacing="2.8"
      >
        SMITH &amp; ADAMS
      </text>
    </svg>
  );
}
