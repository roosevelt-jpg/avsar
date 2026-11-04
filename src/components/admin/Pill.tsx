/** A small rounded label, used for statuses across the console. Kept free of server imports so client tables can use it. */
export function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'muted' | 'dark' }) {
  const tones = {
    neutral: 'bg-surface border border-line text-ink-2',
    accent: 'bg-accent-tint text-accent-deep',
    success: 'bg-[#2f7d4a]/15 text-[#2f7d4a]',
    muted: 'bg-canvas text-muted',
    dark: 'bg-ink text-paper',
  } as const;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
