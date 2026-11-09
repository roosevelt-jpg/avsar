/**
 * Smith & Adams Group wordmark for the footer legal bar: “SMITH & ADAMS”
 * over a hairline rule over “GROUP”. SVG ink only — no background fill —
 * so the navy footer shows through around the letters.
 */

export function BrandGroupLogo({
  size = 28,
  tone = 'dark',
  className = '',
}: {
  size?: number;
  /** dark = white ink on navy; light = charcoal ink on paper. */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const ink = tone === 'dark' ? '#ffffff' : '#1B1A17';
  const rule = tone === 'dark' ? 'rgba(255, 255, 255, 0.55)' : 'rgba(27, 26, 23, 0.55)';
  const height = size;
  const width = Math.round(size * 5);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 280 56"
      fill="none"
      aria-hidden
      className={`h-auto max-w-full shrink ${className}`}
      style={{ width: `min(100%, ${width}px)`, background: 'transparent' }}
    >
      <text
        x="140"
        y="26"
        textAnchor="middle"
        fill={ink}
        fontFamily="var(--font-dm-serif), Georgia, 'Times New Roman', serif"
        fontSize="22"
        fontWeight="400"
        letterSpacing="1.2"
      >
        SMITH &amp; ADAMS
      </text>
      <line x1="48" y1="34" x2="232" y2="34" stroke={rule} strokeWidth="1" />
      <text
        x="140"
        y="48"
        textAnchor="middle"
        fill={ink}
        fontFamily="var(--font-dm-serif), Georgia, 'Times New Roman', serif"
        fontSize="11"
        fontWeight="400"
        letterSpacing="4.5"
      >
        GROUP
      </text>
    </svg>
  );
}
