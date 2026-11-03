/** Gold rule + uppercase label shared by marketing heroes. */
export function MarketingEyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`eyebrow-gold ${className}`.trim()}>{children}</p>;
}
