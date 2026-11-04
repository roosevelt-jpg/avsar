/**
 * S&A wordmark matched to the mockup header/footer: large serif “S&A”, then
 * RECRUITMENT over SMITH & ADAMS with a gold rule between. Tone flips ink for
 * navy bars (dark) vs light paper (light).
 */

export function BrandLogo({
  size = 40,
  tone = 'light',
  className = '',
}: {
  size?: number;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const ink = tone === 'dark' ? '#ffffff' : '#142438';
  const muted = tone === 'dark' ? 'rgba(255, 255, 255, 0.78)' : '#5c7084';
  const gold = '#b28a49';
  /* Mockup mark is wider and taller than the old compact logo. */
  const height = size;
  const width = Math.round(size * 5.2);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 280 54"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      <text
        x="0"
        y="40"
        fill={ink}
        fontFamily="var(--font-dm-serif), 'Times New Roman', Georgia, serif"
        fontSize="42"
        fontWeight="400"
        letterSpacing="-1"
      >
        S&amp;A
      </text>
      <text
        x="98"
        y="18"
        fill={ink}
        fontFamily="var(--font-schibsted), system-ui, sans-serif"
        fontSize="13"
        fontWeight="700"
        letterSpacing="2.6"
      >
        RECRUITMENT
      </text>
      <line x1="98" y1="26" x2="268" y2="26" stroke={gold} strokeWidth="1.75" />
      <text
        x="98"
        y="42"
        fill={muted}
        fontFamily="var(--font-schibsted), system-ui, sans-serif"
        fontSize="11"
        fontWeight="600"
        letterSpacing="2.4"
      >
        SMITH &amp; ADAMS
      </text>
    </svg>
  );
}
