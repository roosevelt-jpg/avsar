'use client';

import { useId, useMemo, useState, useSyncExternalStore } from 'react';
import type { Office } from '@/lib/company/config';
import { str, type BlockData } from '@/lib/cms/blocks';

type Place = {
  id: string;
  kind: 'hub' | 'office';
  label: string;
  note: string;
  address: string;
  role: string;
  country: string;
  flag: 'in' | 'pt' | 'ae' | 'generic';
  x: number;
  y: number;
};

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function reducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resolvePlace(office: Office, index: number): Omit<Place, 'id'> {
  const key = `${office.city}|${office.country ?? ''}`.toLowerCase();
  if (key.includes('lisbon') || key.includes('portugal')) {
    return {
      kind: 'office',
      label: office.city,
      note: office.country || '',
      address: office.address,
      role: office.role || '',
      country: office.country || 'Portugal',
      flag: 'pt',
      x: 21,
      y: 41,
    };
  }
  if (key.includes('dubai') || key.includes('emirates') || key.includes('uae')) {
    return {
      kind: 'office',
      label: office.city,
      note: office.country || '',
      address: office.address,
      role: office.role || '',
      country: office.country || 'United Arab Emirates',
      flag: 'ae',
      x: 57,
      y: 47,
    };
  }
  return {
    kind: 'office',
    label: office.city,
    note: office.country || '',
    address: office.address,
    role: office.role || '',
    country: office.country || '',
    flag: 'generic',
    x: 40 + index * 6,
    y: 40,
  };
}

/** Compact national flags drawn in SVG so we never fetch third-party assets. */
function FlagMark({ code, size = 14 }: { code: Place['flag']; size?: number }) {
  const h = Math.round(size * 0.7);
  if (code === 'in') {
    return (
      <svg width={size} height={h} viewBox="0 0 21 14" aria-hidden className="shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
        <rect width="21" height="14" fill="#FF9933" />
        <rect y="4.67" width="21" height="4.66" fill="#fff" />
        <rect y="9.33" width="21" height="4.67" fill="#138808" />
        <circle cx="10.5" cy="7" r="2" fill="none" stroke="#000080" strokeWidth="0.7" />
      </svg>
    );
  }
  if (code === 'pt') {
    return (
      <svg width={size} height={h} viewBox="0 0 21 14" aria-hidden className="shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
        <rect width="21" height="14" fill="#FF0000" />
        <rect width="8" height="14" fill="#006600" />
        <circle cx="8" cy="7" r="2.2" fill="#FFCC00" />
      </svg>
    );
  }
  if (code === 'ae') {
    return (
      <svg width={size} height={h} viewBox="0 0 21 14" aria-hidden className="shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
        <rect width="21" height="4.67" fill="#00732F" />
        <rect y="4.67" width="21" height="4.66" fill="#fff" />
        <rect y="9.33" width="21" height="4.67" fill="#000" />
        <rect width="5.5" height="14" fill="#FF0000" />
      </svg>
    );
  }
  return (
    <svg width={size} height={h} viewBox="0 0 21 14" aria-hidden className="shrink-0 overflow-hidden rounded-[2px] bg-white/20">
      <rect width="21" height="14" fill="#b28a49" opacity="0.5" />
    </svg>
  );
}

/**
 * Stylised India → UAE → Portugal corridor. Country silhouettes, flag pins and
 * a live path tracker mirror the DSS footprint pattern without cloning their
 * Leaflet/satellite stack or inventing offices that are not in Settings.
 */
export function PresenceMapBlock({
  data,
  offices,
}: {
  data: BlockData;
  offices: Office[];
}) {
  const uid = useId().replace(/:/g, '');
  const hubLabel = str(data, 'hubLabel') || 'India — talent source';
  const hubNote = str(data, 'hubNote');
  const reduce = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => false);

  const places = useMemo<Place[]>(() => {
    const list: Place[] = [
      {
        id: 'hub-india',
        kind: 'hub',
        label: hubLabel,
        note: hubNote,
        address: '',
        role: '',
        country: 'India',
        flag: 'in',
        x: 71,
        y: 52,
      },
    ];
    offices.forEach((office, index) => {
      list.push({ id: `office-${office.city}-${index}`, ...resolvePlace(office, index) });
    });
    return list;
  }, [offices, hubLabel, hubNote]);

  const [activeId, setActiveId] = useState(places[0]?.id ?? '');
  const active = places.find((place) => place.id === activeId) ?? places[0];
  const countries = new Set(
    places.flatMap((place) => {
      if (place.kind === 'hub') return ['India'];
      return place.country ? [place.country] : [place.label];
    }),
  );

  const pinLabel = (place: Place) => (place.kind === 'hub' ? 'India' : place.label);
  const routeId = `corridor-route-${uid}`;
  const glowId = `corridor-glow-${uid}`;
  const seaId = `corridor-sea-${uid}`;
  const landId = `corridor-land-${uid}`;

  return (
    <section className="bg-[#142438] px-[clamp(16px,4cqi,56px)] py-[clamp(40px,6cqi,72px)] text-white">
      <div className="mx-auto grid w-full max-w-[1200px] gap-6 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] lg:gap-8">
        <aside className="rounded-[14px] border border-white/15 bg-white/5 p-5 backdrop-blur-sm">
          {str(data, 'eyebrow') ? (
            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gold)]">{str(data, 'eyebrow')}</p>
          ) : null}
          {str(data, 'title') ? (
            <h2 className="m-0 mt-2 text-[clamp(24px,3cqi,32px)] font-semibold tracking-[-0.03em] text-white">{str(data, 'title')}</h2>
          ) : null}
          {str(data, 'intro') ? (
            <p className="m-0 mt-3 text-[14px] leading-[1.55] text-white/75">{str(data, 'intro')}</p>
          ) : null}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-[var(--color-gold)]/40 bg-[#142438]/40 px-3 py-3">
              <p className="m-0 text-[28px] font-semibold tabular-nums leading-none">{offices.length}</p>
              <p className="m-0 mt-1 text-[12px] text-white/70">Offices</p>
            </div>
            <div className="rounded-[10px] border border-white/20 bg-[#142438]/40 px-3 py-3">
              <p className="m-0 text-[28px] font-semibold tabular-nums leading-none">{countries.size}</p>
              <p className="m-0 mt-1 text-[12px] text-white/70">Countries</p>
            </div>
          </div>
          <ul className="m-0 mt-5 flex max-h-[280px] list-none flex-col gap-1.5 overflow-auto p-0">
            {places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(place.id)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border px-3 py-2.5 text-start text-[14px] transition-colors ${
                    active?.id === place.id
                      ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/15 text-white'
                      : 'border-transparent bg-transparent text-white/80 hover:bg-white/8'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <FlagMark code={place.flag} />
                    <span className="truncate font-medium">{place.label}</span>
                  </span>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-white/50">
                    {place.kind === 'hub' ? 'Source' : 'Office'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="presence-map relative min-h-[320px] overflow-hidden rounded-[14px] border border-white/10 bg-[#0b1622] sm:min-h-[420px]">
          <svg viewBox="0 0 100 70" className="absolute inset-0 size-full" role="img" aria-label="Recruitment corridor from India through the UAE to Portugal">
            <defs>
              <linearGradient id={seaId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#12283c" />
                <stop offset="55%" stopColor="#0f1c2c" />
                <stop offset="100%" stopColor="#0a141f" />
              </linearGradient>
              <linearGradient id={landId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a455c" />
                <stop offset="100%" stopColor="#1a3044" />
              </linearGradient>
              <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.55" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <path id={routeId} d="M21 41 C 32 28, 46 30, 57 47 C 61 50, 66 52, 71 52" fill="none" />
            </defs>

            <rect width="100" height="70" fill={`url(#${seaId})`} />

            <g fill={`url(#${landId})`} opacity="0.55">
              <path d="M8 28 C 12 22, 18 20, 24 22 C 28 24, 30 30, 28 36 C 26 42, 22 48, 18 50 C 14 48, 10 42, 8 36 Z" />
              <path d="M26 24 C 34 18, 48 16, 58 20 C 66 24, 70 30, 68 36 C 64 40, 54 38, 46 36 C 38 34, 30 32, 26 28 Z" opacity="0.45" />
              <path d="M48 40 C 52 36, 60 34, 68 36 C 74 40, 78 46, 76 52 C 72 58, 64 60, 58 56 C 52 52, 48 46, 48 40 Z" />
              <path d="M64 44 C 70 40, 78 42, 82 48 C 84 54, 80 60, 74 62 C 68 60, 64 54, 64 48 Z" />
            </g>

            <g>
              <path
                d="M17 36 C 19 33, 22 32, 24 34 C 25 37, 24 42, 23 46 C 22 49, 20 50, 18 48 C 16 45, 16 40, 17 36 Z"
                fill={active?.flag === 'pt' ? '#3d5f7a' : '#2a455c'}
                stroke="#b28a49"
                strokeWidth={active?.flag === 'pt' ? 0.35 : 0.2}
                opacity="0.95"
              />
              <path
                d="M54 45 C 56 43, 60 43, 62 45 C 63 47, 62 50, 60 51 C 57 52, 54 50, 54 47 Z"
                fill={active?.flag === 'ae' ? '#3d5f7a' : '#2a455c'}
                stroke="#b28a49"
                strokeWidth={active?.flag === 'ae' ? 0.35 : 0.2}
                opacity="0.95"
              />
              <path
                d="M66 46 C 70 42, 76 42, 80 46 C 82 50, 80 56, 76 58 C 72 60, 68 58, 66 54 C 64 50, 64 48, 66 46 Z"
                fill={active?.flag === 'in' ? '#3d5f7a' : '#2a455c'}
                stroke="#b28a49"
                strokeWidth={active?.flag === 'in' ? 0.35 : 0.2}
                opacity="0.95"
              />
            </g>

            <use href={`#${routeId}`} stroke="#b28a49" strokeWidth="0.55" opacity="0.35" fill="none" />
            <use
              href={`#${routeId}`}
              className={reduce ? undefined : 'presence-route-dash'}
              stroke="#b28a49"
              strokeWidth="0.45"
              strokeDasharray="1.4 1.2"
              fill="none"
              opacity="0.95"
            />

            {!reduce ? (
              <g filter={`url(#${glowId})`}>
                <circle r="1.15" fill="#f4e0b5" stroke="#b28a49" strokeWidth="0.35">
                  <animateMotion dur="7.5s" repeatCount="indefinite" rotate="auto">
                    <mpath href={`#${routeId}`} />
                  </animateMotion>
                </circle>
                <circle r="2.4" fill="#b28a49" opacity="0.22">
                  <animateMotion dur="7.5s" repeatCount="indefinite">
                    <mpath href={`#${routeId}`} />
                  </animateMotion>
                </circle>
              </g>
            ) : null}

            {places.map((place) => {
              const selected = active?.id === place.id;
              return (
                <g key={place.id} className="cursor-pointer" onClick={() => setActiveId(place.id)}>
                  {!reduce ? (
                    <circle
                      cx={place.x}
                      cy={place.y}
                      r={selected ? 4.2 : 3.4}
                      fill="none"
                      stroke={place.kind === 'hub' ? '#b28a49' : '#f4f8fb'}
                      strokeWidth="0.35"
                      className="presence-pin-pulse"
                      opacity="0.55"
                    />
                  ) : null}
                  <circle
                    cx={place.x}
                    cy={place.y}
                    r={selected ? 2.2 : 1.7}
                    fill={place.kind === 'hub' ? '#b28a49' : '#f4f8fb'}
                    stroke="#142438"
                    strokeWidth="0.35"
                  />
                </g>
              );
            })}
          </svg>

          {/* Flag chips sit in HTML so type stays sharp at every viewport size. */}
          {places.map((place) => {
            const selected = active?.id === place.id;
            return (
              <button
                key={`${place.id}-chip`}
                type="button"
                onClick={() => setActiveId(place.id)}
                style={{ left: `${place.x}%`, top: `${(place.y / 70) * 100}%` }}
                className={`absolute z-10 flex -translate-x-1/2 -translate-y-[140%] cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-colors ${
                  selected
                    ? 'border-[#b28a49] bg-[#142438] text-white'
                    : 'border-white/70 bg-white text-[#142438] hover:border-[#b28a49]'
                }`}
              >
                <FlagMark code={place.flag} size={14} />
                <span>{pinLabel(place)}</span>
              </button>
            );
          })}

          {active ? (
            <div className="absolute inset-x-4 bottom-4 z-20 rounded-[12px] border border-white/20 bg-[#142438]/88 p-4 backdrop-blur-sm sm:inset-x-auto sm:end-4 sm:w-[min(100%-2rem,320px)]">
              <div className="flex items-center gap-2">
                <FlagMark code={active.flag} size={18} />
                <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gold)]">
                  {active.kind === 'hub' ? 'Talent source' : 'Office'}
                </p>
              </div>
              <h3 className="m-0 mt-1 text-[18px] font-semibold text-white">{active.label}</h3>
              {active.kind === 'office' && active.role ? (
                <p className="m-0 mt-1 text-[13px] text-white/75">{active.role}</p>
              ) : null}
              {active.kind === 'office' && active.address ? (
                <p className="m-0 mt-2 text-[13px] leading-[1.45] text-white/80">{active.address}</p>
              ) : null}
              {active.kind === 'hub' && active.note ? (
                <p className="m-0 mt-2 text-[13px] leading-[1.45] text-white/80">{active.note}</p>
              ) : null}
              {active.kind === 'office' && active.country ? (
                <p className="m-0 mt-2 text-[12px] text-white/55">{active.country}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
