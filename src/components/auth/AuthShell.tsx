import { HeroBubbles } from '@/components/cms/HeroBubbles';
import { HeroRouteMap } from '@/components/cms/HeroRouteMap';

/**
 * Full-viewport frame for sign-in and sign-up.
 *
 * Same atmosphere as the home hero (warm wash, route map, floating glass
 * spheres and phrase chips) so these pages feel like part of the product
 * rather than a blank form on white. The form content sits above it on a
 * frosted surface so type stays readable.
 */

const PHRASES = [
  'India → Portugal',
  'Chefs & kitchen teams',
  'Electricians & welders',
  'Lisbon · Porto · Algarve',
  'Free skills test',
  'Interview on Zoom',
  'Visa file prepared with you',
  'Housing & meals included',
  'WhatsApp in Hindi or English',
  '₹0 placement fee',
];

export function AuthShell({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(60% 60% at 85% 10%, var(--color-tint-sky) 0%, transparent 60%), radial-gradient(50% 50% at 0% 100%, var(--color-canvas) 0%, transparent 60%), radial-gradient(40% 40% at 50% 50%, var(--color-tint-sand) 0%, transparent 70%)',
        }}
      />
      {/* Extra spheres on small screens: HeroBubbles only floats them from lg up. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
        <span
          className="motion-float absolute -left-6 top-[12%] size-24 rounded-full opacity-80"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, var(--color-tint-clay) 55%, color-mix(in oklab, var(--color-tint-clay) 80%, var(--color-ink) 12%) 100%)',
            animationDuration: '10s',
          }}
        />
        <span
          className="motion-float absolute -right-4 top-[58%] size-16 rounded-full opacity-80"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, var(--color-tint-sky) 55%, color-mix(in oklab, var(--color-tint-sky) 80%, var(--color-ink) 12%) 100%)',
            animationDuration: '8s',
            animationDelay: '-2s',
          }}
        />
        <span
          className="motion-float absolute bottom-[8%] left-[18%] size-10 rounded-full opacity-70"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, var(--color-tint-sage) 55%, color-mix(in oklab, var(--color-tint-sage) 80%, var(--color-ink) 12%) 100%)',
            animationDuration: '7s',
            animationDelay: '-4s',
          }}
        />
      </div>
      <HeroRouteMap />
      <HeroBubbles phrases={PHRASES} />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-[clamp(20px,4cqi,56px)] py-[18px]">
        {header}
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,8cqi,96px)] pt-[clamp(24px,4cqi,48px)]">
        {children}
      </main>
    </div>
  );
}

/** Frosted panel that keeps form type readable over the moving backdrop. */
export function AuthPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[28px] border border-line bg-surface/80 p-[clamp(24px,4cqi,40px)] shadow-[0_24px_60px_-28px_rgba(27,26,23,0.35)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
