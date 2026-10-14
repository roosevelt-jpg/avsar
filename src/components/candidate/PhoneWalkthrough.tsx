'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { useInView } from '@/components/motion/useInView';
import type { Dictionary } from '@/lib/i18n';

/**
 * The six steps, with the screen each one produces.
 *
 * The section used to be six paragraphs in a grid, and a candidate reading it
 * had to imagine what "take the assessment" looked like. What persuades
 * somebody to start is seeing that it is a short form on a phone rather than a
 * process.
 *
 * The composition is held to a width and centred rather than filling the
 * viewport. An earlier version let the step column take whatever space was
 * left, which on a wide screen pushed the text to the far edge and ran a
 * description across thirteen hundred pixels: two columns that had stopped
 * being a pair.
 *
 * The rail between the steps is the logo's dotted route stood on end. The part
 * already travelled is solid and terracotta, the part ahead is dotted, so the
 * mark earns its place by doing a job rather than decorating the top of the
 * section.
 */

/** In the order of `t.process.steps`. */
const SCREENS = ['register', 'documents', 'assessment', 'fee', 'call', 'letter'] as const;

const LQIP: Record<string, string> = {
  'register':
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAWAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDql5bo1S01SM+tOzSApJfbL9bGUs8xQyblUBcZPHXrV3NFFAH/2Q==',
  'documents':
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAWAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDq16klCP1p+fY0oHJ+b9aWkA3Zznin0UUwP//Z',
  'assessment':
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAWAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDrlxyCKjFtAAAIlAHSl3PnAjz/AMCFPGcc0gDHPtS0UUAf/9k=',
  'fee':
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAWAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDqg6Bj1/Kn7hVEXUL3Jh/eh9xH+qbH54xVwdKkuyI1kRn24bJOKm2iiigm7P/Z',
  'call':
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAWAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDsUGB0xz2pD1pqEjPQc9hS5pANUYzTqKKAP//Z',
  'letter':
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAWAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDq1K7u+foakrm5NI16SV2i1UBSxwPMbjn6VeisdUSJFkvgzhQGO48n8qQGwOnPNJRRQB//2Q==',
};

/** Long enough to read the step, short enough that nobody waits for it. */
const DWELL = 5600;

export function PhoneWalkthrough({ t }: { t: Dictionary }) {
  const steps = t.process.steps;
  const [active, setActive] = useState(0);
  /* Stops as soon as somebody chooses for themselves. A carousel that keeps
     moving under the reader's hand is a carousel fighting them. */
  const [auto, setAuto] = useState(true);
  const { ref, seen } = useInView<HTMLDivElement>();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!auto || !seen) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    timer.current = window.setTimeout(() => setActive((i) => (i + 1) % SCREENS.length), DWELL);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [active, auto, seen]);

  function choose(index: number) {
    setAuto(false);
    setActive(index);
  }

  return (
    <div
      ref={ref}
      className="mx-auto grid max-w-[880px] items-center gap-x-[clamp(28px,5cqi,64px)] gap-y-[clamp(36px,5cqi,52px)] lg:grid-cols-[286px_minmax(0,1fr)]"
    >
      {/* ------------------------------------------------------------ phone */}
      <div className="relative justify-self-center">
        {/* A terracotta wash behind the handset. The section is one flat ink
            rectangle, and without it the phone sits on the background rather
            than in front of it. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-12 rounded-full bg-[radial-gradient(circle_at_50%_38%,rgba(201,106,75,0.22),transparent_68%)] blur-[26px]"
        />
        <div className="relative w-[286px] rounded-[42px] bg-[#0d0c0b] p-[10px] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
          {/* One detail is enough to read as a phone. A notch, a camera and a
              home bar would be a drawing of a phone. */}
          <span className="absolute left-1/2 top-[17px] z-10 h-[4px] w-[56px] -translate-x-1/2 rounded-full bg-white/15" />
          <div className="relative aspect-[390/844] w-full overflow-hidden rounded-[33px] bg-paper">
            {SCREENS.map((screen, index) => (
              <Image
                key={screen}
                src={`/walkthrough/${screen}.jpg`}
                alt={steps[index]?.[0] ?? screen}
                fill
                sizes="286px"
                placeholder="blur"
                blurDataURL={LQIP[screen]}
                priority={index === 0}
                className={`object-cover object-top transition-opacity duration-[600ms] ease-out ${
                  index === active ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Where the reader is in the six. The screens change on a timer, and
            without a count the handset looks like it is cycling at random. */}
        <p className="relative m-0 mt-5 text-center">
          <Mono className="text-dark-muted">
            {String(active + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </Mono>
        </p>
      </div>

      {/* ------------------------------------------------------------ steps */}
      <ol className="m-0 flex w-full list-none flex-col p-0">
        {steps.map(([title, body], index) => {
          const current = index === active;
          const travelled = index < active;
          const last = index === steps.length - 1;

          return (
            <li key={title} className="relative">
              {/* The panel behind whichever step is open. Low enough in
                  contrast to be structure rather than a card, which is why it
                  is a wash and a hairline instead of a border and a fill. */}
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-x-[-12px] inset-y-[3px] lg:inset-x-[-20px] rounded-[18px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] transition-opacity duration-[450ms] ease-out ${
                  current ? 'opacity-100' : 'opacity-0'
                }`}
              />

              <button
                type="button"
                onClick={() => choose(index)}
                aria-current={current ? 'step' : undefined}
                className="group relative flex w-full cursor-pointer gap-4 border-0 bg-transparent p-0 text-left"
              >
                {/*
                  The rail: the logo's route, stood on end. Solid behind,
                  dotted ahead.

                  The padding lives on the text beside it rather than on the
                  button, so this column stretches the full height of the row
                  and the line meets the next one exactly. With the padding on
                  the button the line broke at every step.
                */}
                <span className="relative flex w-[13px] shrink-0 flex-col items-center pt-[19px]">
                  <span
                    className={`z-10 block rounded-full transition-all duration-[450ms] ease-out ${
                      current
                        ? 'size-[13px] bg-accent-on-dark shadow-[0_0_0_5px_rgba(201,106,75,0.18)]'
                        : travelled
                          ? 'size-[9px] bg-accent-on-dark/70'
                          : 'size-[9px] border-[2px] border-dark-line bg-transparent'
                    }`}
                  />
                  {!last && (
                    <span className="relative mt-2 w-[2px] flex-1 overflow-hidden rounded-full">
                      <span
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(to bottom, rgba(247,245,240,0.24) 0 2px, transparent 2px 9px)',
                        }}
                      />
                      <span
                        className="absolute inset-x-0 top-0 bg-accent-on-dark/70 transition-[height] duration-[600ms] ease-out"
                        style={{ height: travelled ? '100%' : '0%' }}
                      />
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1 py-4">
                  <Mono
                    className={`transition-colors ${current ? 'text-accent-on-dark' : 'text-dark-muted'}`}
                  >
                    STEP {index + 1}
                  </Mono>
                  <span
                    className={`mt-1.5 block text-[18px] font-semibold leading-[1.35] transition-colors duration-300 ${
                      current ? 'text-paper' : 'text-dark-muted-2/70 group-hover:text-dark-muted-2'
                    }`}
                  >
                    {title}
                  </span>

                  {/* Only the step being read carries its paragraph. Six at once
                      is a wall; one is a sentence somebody finishes. */}
                  <span
                    className={`grid transition-all duration-[450ms] ease-out ${
                      current ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <span className="overflow-hidden">
                      <span className="block max-w-[46ch] text-[14.5px] leading-[1.6] text-dark-muted-2">
                        {body}
                      </span>
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
