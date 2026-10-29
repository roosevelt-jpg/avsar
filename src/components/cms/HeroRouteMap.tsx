/**
 * A faint watermark behind the hero: India on the right, Portugal on the
 * left, and two flight arcs from Delhi and Mumbai to Porto and Lisbon.
 *
 * The outlines are simplified from real coordinates on a plain
 * longitude/latitude grid (x = (lon + 20) * 10, y = (50 - lat) * 10), so
 * the two countries sit where they really are relative to each other.
 * Portugal is drawn 2.2 times larger around its centre; at true scale it
 * would be a speck next to India. Inline SVG: no request, about 2 KB.
 */

const INDIA =
  'M884 265 L882 263 L910 255 L903 235 L920 220 L935 201 L946 185 L945 173 L940 158 L950 140 L978 145 L990 157 L988 175 L995 190 L1010 198 L1030 210 L1050 220 L1080 221 L1090 232 L1120 224 L1140 217 L1165 216 L1173 223 L1160 230 L1150 240 L1145 255 L1133 265 L1126 280 L1122 264 L1115 259 L1100 248 L1098 241 L1085 237 L1082 250 L1088 280 L1080 284 L1069 288 L1050 305 L1040 317 L1023 334 L1010 342 L1002 350 L1003 367 L999 397 L993 398 L982 411 L975 419 L966 411 L960 395 L953 380 L947 365 L940 350 L934 335 L929 310 L928 295 L925 277 L921 288 L909 293 L892 278 L897 272 Z';

const PORTUGAL =
  'M102.4 47.8 L115.6 47.8 L150.8 52.2 L159.6 58.8 L144.2 72 L144.2 87.4 L142 100.6 L131 102.8 L142 118.2 L135.4 129.2 L142 138 L131 149 L133.2 155.6 L120 160 L100.2 160 L102.4 140.2 L100.2 127 L87 122.6 L89.2 107.2 L98 89.6 L104.6 67.6 Z';

/* Cities on the same grid: Delhi, Mumbai, Lisbon, Porto. */
const DELHI = [972, 214] as const;
const MUMBAI = [929, 310] as const;
const LISBON = [96, 123] as const;
const PORTO = [107, 69] as const;

export function HeroRouteMap() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-[2vw]">
      <svg
        viewBox="40 0 1180 460"
        className="h-auto w-full max-w-[1600px] text-[#0a088f]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={INDIA} fill="currentColor" fillOpacity={0.35} strokeWidth={2} />
        <path d={PORTUGAL} fill="currentColor" fillOpacity={0.35} strokeWidth={2} />

        {/* Two routes arching north, the way long-haul flights look on a flat map. */}
        <path
          className="motion-route"
          d={`M${DELHI[0]} ${DELHI[1]} Q 560 -60 ${PORTO[0]} ${PORTO[1]}`}
          stroke="#c96a4b"
          strokeWidth={2.5}
          strokeDasharray="10 18"
        />
        <path
          className="motion-route"
          d={`M${MUMBAI[0]} ${MUMBAI[1]} Q 520 20 ${LISBON[0]} ${LISBON[1]}`}
          stroke="#c96a4b"
          strokeWidth={2.5}
          strokeDasharray="10 18"
        />

        {[DELHI, MUMBAI, LISBON, PORTO].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={14} strokeWidth={2} />
            <circle cx={cx} cy={cy} r={5} fill="currentColor" stroke="none" />
          </g>
        ))}

        {/* A small arrowhead at the middle of the upper route, pointing west towards Portugal. */}
        <path d="M528 41 l24 -9 l-6 9 l6 9 z" fill="#c96a4b" stroke="none" />
      </svg>
    </div>
  );
}
