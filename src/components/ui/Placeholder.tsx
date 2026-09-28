/**
 * Striped stand-in for photography that does not exist yet. The label says what
 * belongs there so the gap is obvious rather than looking like a broken image.
 */
export function Placeholder({
  label,
  className = '',
  radius = 'rounded-[24px]',
  ratio,
}: {
  label: string;
  className?: string;
  radius?: string;
  ratio?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`placeholder-stripes flex items-center justify-center border border-line ${radius} ${ratio ?? ''} ${className}`}
    >
      <span className="font-mono text-[12px] text-muted px-4 text-center">{label}</span>
    </div>
  );
}
