/**
 * S&A wordmark matched to the mockup header/footer: large serif “S&A”, then
 * RECRUITMENT over SMITH & ADAMS with a gold rule between. The rule is a full
 * width of the right-hand stack so it always matches the longer of the two
 * lines instead of a guessed SVG end point. Tone flips ink for navy bars
 * (dark) vs light paper (light).
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
  /* Right stack scales with the mark height so header and footer stay proportional. */
  const mark = size;
  const stackSize = Math.max(9, Math.round(size * 0.32));
  const subSize = Math.max(8, Math.round(size * 0.275));
  const gap = Math.max(6, Math.round(size * 0.22));

  return (
    <span
      aria-hidden
      className={`inline-flex max-w-full shrink items-center ${className}`}
      style={{ gap, height: mark, color: ink }}
    >
      <span
        className="leading-none"
        style={{
          fontFamily: "var(--font-dm-serif), 'Times New Roman', Georgia, serif",
          fontSize: mark * 0.95,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        S&A
      </span>
      {/*
        The column is only as wide as its text; the gold rule is width 100% of
        that column so it cannot overshoot RECRUITMENT / SMITH & ADAMS.
      */}
      <span
        className="inline-flex w-max flex-col justify-center"
        style={{ gap: Math.max(2, Math.round(size * 0.06)) }}
      >
        <span
          className="whitespace-nowrap leading-none"
          style={{
            fontFamily: 'var(--font-schibsted), system-ui, sans-serif',
            fontSize: stackSize,
            fontWeight: 700,
            /* Negative margin cancels the trailing letter-spacing so the
               column width matches the last glyph, not an empty gap after it. */
            letterSpacing: '0.2em',
            marginRight: '-0.2em',
            color: ink,
          }}
        >
          RECRUITMENT
        </span>
        <span
          aria-hidden
          className="block w-full"
          style={{ height: 1.75, background: gold }}
        />
        <span
          className="whitespace-nowrap leading-none"
          style={{
            fontFamily: 'var(--font-schibsted), system-ui, sans-serif',
            fontSize: subSize,
            fontWeight: 600,
            letterSpacing: '0.18em',
            marginRight: '-0.18em',
            color: muted,
          }}
        >
          SMITH & ADAMS
        </span>
      </span>
    </span>
  );
}
