/**
 * The floating background of the hero: soft glass spheres, and phrase
 * bubbles from the CMS ("Interview on Zoom", "Housing & meals included")
 * drifting in the margins either side of the headline.
 *
 * Pure decoration: hidden from screen readers, never clickable, and the
 * phrase bubbles only appear where the margins are wide enough not to sit
 * on top of the text. Motion is the shared float, which reduced motion turns
 * off.
 */

/* Six slots down each side, alternating sides so a short list still looks
   balanced. Percentages of a layer up to 1560px wide; the text column is
   880px, so a chip that starts within 3% of the edge and is under ~260px wide
   stays clear of the text from 1536px up, which is when the layer shows. */
const SLOTS = [
  { top: '3%', left: '1%' },
  { top: '6%', right: '0%' },
  { top: '19%', left: '3%' },
  { top: '22%', right: '3%' },
  { top: '35%', left: '0%' },
  { top: '38%', right: '1%' },
  { top: '51%', left: '3%' },
  { top: '54%', right: '3%' },
  { top: '67%', left: '1%' },
  { top: '70%', right: '0%' },
  { top: '83%', left: '3%' },
  { top: '86%', right: '2%' },
] as const;

/* Glass spheres: size in px, position, tint, and their own float timing so
   they never move in step. All hug the edges or the very top and bottom, so
   none sits behind a line of text. */
const SPHERES = [
  { size: 120, top: '-5%', left: '4%', tint: 'var(--color-tint-clay)', duration: 11 },
  { size: 64, top: '58%', left: '-2%', tint: 'var(--color-tint-sky)', duration: 9 },
  { size: 30, top: '90%', left: '8%', tint: 'var(--color-tint-sage)', duration: 7 },
  { size: 96, top: '4%', right: '-1%', tint: 'var(--color-tint-sky)', duration: 12 },
  { size: 44, top: '80%', right: '4%', tint: 'var(--color-tint-clay)', duration: 8 },
  { size: 22, top: '42%', right: '1%', tint: 'var(--color-tint-sand)', duration: 6 },
] as const;

const DOTS = ['bg-accent', 'bg-employer', 'bg-success'] as const;

export function HeroBubbles({ phrases }: { phrases: string[] }) {
  const list = phrases.slice(0, SLOTS.length);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {SPHERES.map((sphere, index) => (
        <span
          key={`s${index}`}
          className="motion-float absolute hidden rounded-full lg:block"
          style={{
            width: sphere.size,
            height: sphere.size,
            top: sphere.top,
            left: 'left' in sphere ? sphere.left : undefined,
            right: 'right' in sphere ? sphere.right : undefined,
            /* A highlight up and to the left, the tint in the body and a
               darker rim: reads as a glass bead without an image. */
            background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 18%, ${sphere.tint} 55%, color-mix(in oklab, ${sphere.tint} 80%, var(--color-ink) 12%) 100%)`,
            boxShadow: `0 ${Math.round(sphere.size / 5)}px ${Math.round(sphere.size / 2)}px -${Math.round(sphere.size / 4)}px rgba(27,26,23,0.25)`,
            opacity: 0.85,
            animationDuration: `${sphere.duration}s`,
            animationDelay: `${index * -1.3}s`,
          }}
        />
      ))}

      {/* The phrase layer reaches past the text column into the margins. */}
      <div className="absolute inset-y-0 left-1/2 hidden w-[min(100vw,1560px)] -translate-x-1/2 2xl:block">
        {list.map((phrase, index) => {
          const slot = SLOTS[index]!;
          return (
            <span
              key={`b${index}`}
              className={`motion-float absolute inline-flex max-w-[250px] items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface/85 px-3.5 py-2 text-[13px] font-medium text-ink-2 shadow-[0_12px_30px_-18px_rgba(27,26,23,0.45)] backdrop-blur-md`}
              style={{
                top: slot.top,
                left: 'left' in slot ? slot.left : undefined,
                right: 'right' in slot ? slot.right : undefined,
                animationDuration: `${7 + (index % 4) * 1.5}s`,
                animationDelay: `${index * -0.9}s`,
              }}
            >
              <span className={`size-1.5 shrink-0 rounded-full ${DOTS[index % DOTS.length]}`} />
              <span className="truncate">{phrase}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
