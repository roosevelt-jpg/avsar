'use client';

import { useMemo, useState } from 'react';
import type { Office } from '@/lib/company/config';
import { str, type BlockData } from '@/lib/cms/blocks';

type Place =
  | { id: string; kind: 'hub'; label: string; note: string; x: number; y: number }
  | { id: string; kind: 'office'; label: string; note: string; address: string; role: string; country: string; x: number; y: number };

/**
 * Stylised India → Portugal corridor with a UAE pin. Offices come from
 * Company settings; India is a talent-source hub, not a fake branch.
 */
export function PresenceMapBlock({
  data,
  offices,
}: {
  data: BlockData;
  offices: Office[];
}) {
  const hubLabel = str(data, 'hubLabel') || 'India — talent source';
  const hubNote = str(data, 'hubNote');
  const places = useMemo<Place[]>(() => {
    const list: Place[] = [
      {
        id: 'hub-india',
        kind: 'hub',
        label: hubLabel,
        note: hubNote,
        x: 68,
        y: 52,
      },
    ];
    for (const office of offices) {
      const key = `${office.city}|${office.country ?? ''}`.toLowerCase();
      const coords =
        key.includes('lisbon') || key.includes('portugal')
          ? { x: 22, y: 42 }
          : key.includes('dubai') || key.includes('emirates') || key.includes('uae')
            ? { x: 58, y: 48 }
            : { x: 40 + list.length * 6, y: 40 };
      list.push({
        id: `office-${office.city}-${list.length}`,
        kind: 'office',
        label: office.city,
        note: office.country || '',
        address: office.address,
        role: office.role || '',
        country: office.country || '',
        ...coords,
      });
    }
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
                  className={`flex w-full cursor-pointer items-center justify-between rounded-[8px] border px-3 py-2.5 text-start text-[14px] transition-colors ${
                    active?.id === place.id
                      ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/15 text-white'
                      : 'border-transparent bg-transparent text-white/80 hover:bg-white/8'
                  }`}
                >
                  <span className="font-medium">{place.label}</span>
                  <span className="text-[11px] uppercase tracking-[0.08em] text-white/50">
                    {place.kind === 'hub' ? 'Source' : 'Office'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="relative min-h-[320px] overflow-hidden rounded-[14px] border border-white/10 bg-[#0f1c2c] sm:min-h-[420px]">
          <svg viewBox="0 0 100 70" className="absolute inset-0 size-full" role="img" aria-label="Recruitment corridor map">
            <defs>
              <linearGradient id="corridor-sea" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#16324a" />
                <stop offset="100%" stopColor="#0f1c2c" />
              </linearGradient>
            </defs>
            <rect width="100" height="70" fill="url(#corridor-sea)" />
            <path
              d="M18 38 C 30 28, 48 30, 66 48"
              fill="none"
              stroke="#b28a49"
              strokeWidth="0.45"
              strokeDasharray="1.2 1.1"
              opacity="0.9"
            />
            <path
              d="M58 48 C 60 50, 64 52, 68 52"
              fill="none"
              stroke="#b28a49"
              strokeWidth="0.35"
              strokeDasharray="0.8 0.9"
              opacity="0.7"
            />
            {places.map((place) => (
              <g key={place.id}>
                <circle
                  cx={place.x}
                  cy={place.y}
                  r={active?.id === place.id ? 2.4 : 1.7}
                  fill={place.kind === 'hub' ? '#b28a49' : '#f4f8fb'}
                  stroke="#142438"
                  strokeWidth="0.35"
                  className="cursor-pointer"
                  onClick={() => setActiveId(place.id)}
                />
                <text
                  x={place.x}
                  y={place.y - 3.2}
                  textAnchor="middle"
                  fill="#f4f8fb"
                  fontSize="2.4"
                  fontFamily="var(--font-dm-sans), system-ui, sans-serif"
                >
                  {place.kind === 'office' ? place.label : 'India'}
                </text>
              </g>
            ))}
          </svg>

          {active ? (
            <div className="absolute inset-x-4 bottom-4 rounded-[12px] border border-white/20 bg-[#142438]/88 p-4 backdrop-blur-sm sm:inset-x-auto sm:end-4 sm:w-[min(100%-2rem,320px)]">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gold)]">
                {active.kind === 'hub' ? 'Talent source' : 'Office'}
              </p>
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
