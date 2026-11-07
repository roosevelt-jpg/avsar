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

/** Matches public/photos/brand/corridor-satellite.jpg (Esri World Imagery crop). */
const MAP_WEST = -15;
const MAP_EAST = 85;
const MAP_SOUTH = 8;
const MAP_NORTH = 52;
const VIEW_W = 100;
const VIEW_H = 70;

function project(lon: number, lat: number) {
  return {
    x: ((lon - MAP_WEST) / (MAP_EAST - MAP_WEST)) * VIEW_W,
    y: ((MAP_NORTH - lat) / (MAP_NORTH - MAP_SOUTH)) * VIEW_H,
  };
}

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
    const point = project(-9.14, 38.72);
    return {
      kind: 'office',
      label: office.city,
      note: office.country || '',
      address: office.address,
      role: office.role || '',
      country: office.country || 'Portugal',
      flag: 'pt',
      ...point,
    };
  }
  if (key.includes('dubai') || key.includes('emirates') || key.includes('uae')) {
    const point = project(55.27, 25.2);
    return {
      kind: 'office',
      label: office.city,
      note: office.country || '',
      address: office.address,
      role: office.role || '',
      country: office.country || 'United Arab Emirates',
      flag: 'ae',
      ...point,
    };
  }
  const fallback = project(40 + index * 8, 30);
  return {
    kind: 'office',
    label: office.city,
    note: office.country || '',
    address: office.address,
    role: office.role || '',
    country: office.country || '',
    flag: 'generic',
    ...fallback,
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
 * India → UAE → Portugal corridor over a hosted satellite basemap. Pins sit on
 * real lon/lat; the dashed tracker and flag chips stay SVG/HTML overlays so we
 * do not need Leaflet or live tile requests.
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
    const hub = project(77.2, 22.5);
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
        ...hub,
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
  const lisbon = places.find((place) => place.flag === 'pt') ?? { x: 6, y: 21 };
  const dubai = places.find((place) => place.flag === 'ae') ?? { x: 70, y: 43 };
  const indiaPin = places.find((place) => place.flag === 'in') ?? { x: 92, y: 47 };
  const routeId = `corridor-route-${uid}`;
  const glowId = `corridor-glow-${uid}`;
  const routePath = `M${lisbon.x.toFixed(2)} ${lisbon.y.toFixed(2)} C ${(lisbon.x + 18).toFixed(2)} ${(lisbon.y - 14).toFixed(2)}, ${(dubai.x - 12).toFixed(2)} ${(dubai.y - 10).toFixed(2)}, ${dubai.x.toFixed(2)} ${dubai.y.toFixed(2)} S ${(indiaPin.x - 8).toFixed(2)} ${(indiaPin.y + 2).toFixed(2)}, ${indiaPin.x.toFixed(2)} ${indiaPin.y.toFixed(2)}`;

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
          {/* Hosted Esri World Imagery crop — no live tile SDK. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/photos/brand/corridor-satellite.jpg"
            alt=""
            className="absolute inset-0 size-full object-cover object-[center_45%]"
            decoding="async"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#0b1622]/38" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1622]/55 via-transparent to-[#0b1622]/25" />

          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 size-full" role="img" aria-label="Recruitment corridor from India through the UAE to Portugal">
            <defs>
              <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.55" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <path id={routeId} d={routePath} fill="none" />
            </defs>

            <use href={`#${routeId}`} stroke="#142438" strokeWidth="1.1" opacity="0.35" fill="none" />
            <use href={`#${routeId}`} stroke="#b28a49" strokeWidth="0.55" opacity="0.4" fill="none" />
            <use
              href={`#${routeId}`}
              className={reduce ? undefined : 'presence-route-dash'}
              stroke="#f4e0b5"
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

          {places.map((place) => {
            const selected = active?.id === place.id;
            return (
              <button
                key={`${place.id}-chip`}
                type="button"
                onClick={() => setActiveId(place.id)}
                style={{ left: `${place.x}%`, top: `${(place.y / VIEW_H) * 100}%` }}
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
            <div className="absolute inset-x-4 bottom-4 z-20 rounded-[12px] border border-white/20 bg-[#142438]/88 p-4 backdrop-blur-sm sm:inset-x-auto sm:right-4 sm:w-[min(100%-2rem,320px)]">
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
