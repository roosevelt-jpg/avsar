/**
 * Full-viewport frame for sign-in and related account screens.
 *
 * Clean mockup surface: ivory paper, navy accents. The old India→Portugal
 * route map, floating bubbles and phrase chips are gone.
 */

export function AuthShell({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="market relative flex min-h-[100dvh] flex-col bg-[#f7f4ee] text-[#142438]">
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#142438]/10 bg-[#142438] px-[clamp(20px,4cqi,56px)] py-[18px] text-white">
        {header}
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,8cqi,96px)] pt-[clamp(24px,4cqi,48px)]">
        {children}
      </main>
    </div>
  );
}

/** Form panel on the account screens — flat white card, mockup radius. */
export function AuthPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[12px] border border-[#142438]/12 bg-white p-[clamp(24px,4cqi,40px)] shadow-[0_18px_40px_-28px_rgba(20,36,56,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}
