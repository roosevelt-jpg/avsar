import type { ReactNode } from 'react';

/**
 * Shared console home header.
 *
 * Solid navy with a quiet gold rule — no stock photo underlay. Photo banners
 * on dashboard homes read as template kits; a calm panel reads as product UI.
 */
export function DashHeroPanel({
  eyebrow,
  badge,
  title,
  intro,
  actions,
  aside,
}: {
  eyebrow: string;
  badge?: ReactNode;
  title: ReactNode;
  intro: string;
  actions?: ReactNode;
  /** Optional right column (CMS preview still, etc.). */
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[14px] border border-[#142438]/12 bg-[#142438] text-white">
      {/* Soft depth without photography: a low diagonal wash. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(120% 80% at 100% 0%, rgba(178,138,73,0.18) 0%, transparent 42%), linear-gradient(135deg, #142438 0%, #1a3148 55%, #142438 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 start-0 w-[3px] bg-[#b28a49]"
      />
      <div
        className={`relative z-[1] gap-6 px-5 py-7 sm:px-8 sm:py-8 ${
          aside ? 'grid items-center lg:grid-cols-[1.25fr_0.75fr]' : ''
        }`}
      >
        <div className={aside ? '' : 'lg:max-w-[68%]'}>
          <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d4b574]">
              {eyebrow}
            </p>
            {badge}
          </div>
          <h1 className="m-0 text-[clamp(24px,3.2cqi,36px)] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
            {title}
          </h1>
          <p className="m-0 mt-3 max-w-[52ch] text-[15px] leading-[1.6] text-white/78">{intro}</p>
          {actions ? <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div> : null}
        </div>
        {aside}
      </div>
    </section>
  );
}

export const dashPrimaryBtn =
  'inline-flex rounded-[8px] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#142438] no-underline transition-colors hover:bg-[#f0f2f5]';

export const dashSecondaryBtn =
  'inline-flex rounded-[8px] border border-white/40 px-4 py-2.5 text-[14px] font-medium text-white no-underline transition-colors hover:border-white hover:bg-white/10';
