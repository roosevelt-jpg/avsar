'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { fill, type Dictionary, type Locale, localePath } from '@/lib/i18n';
import type { ClientItem, SectionId } from '@/lib/assessment/items';

const KEYS = ['A', 'B', 'C', 'D'] as const;

export function AssessmentRunner({
  locale,
  t,
  items,
  currentSection,
  attemptId,
  /** Seconds left, computed on the server. The client only counts down. */
  secondsRemaining,
  /** Answers already stored for this attempt, so a resumed section is filled in. */
  savedAnswers,
}: {
  locale: Locale;
  t: Dictionary;
  items: ClientItem[];
  currentSection: SectionId;
  attemptId: string | null;
  secondsRemaining: number;
  savedAnswers: Record<string, number>;
}) {
  const router = useRouter();
  const a = t.assess;

  /* Start where they left off. Dropping someone back at question one of a
     section they half finished is the same insult as losing their answers. */
  const firstUnanswered = items.findIndex((candidate) => savedAnswers[candidate.id] === undefined);
  const [index, setIndex] = useState(firstUnanswered > 0 ? firstUnanswered : 0);
  const [answers, setAnswers] = useState<Record<string, number>>(savedAnswers);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [left, setLeft] = useState(secondsRemaining);
  const [finishing, setFinishing] = useState(false);

  /* Clamped as well as keyed. If anything ever carries an index across a
     section again, the candidate sees the last question rather than a dead
     end mid-assessment. */
  const total = items.length;
  const safeIndex = Math.min(index, Math.max(0, total - 1));
  const item = items[safeIndex];

  /* The authoritative deadline lives on the server. This is display only, so a
     clock change or a paused tab cannot buy extra time. */
  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [left]);

  /**
   * Answers waiting to be written, keyed by item.
   *
   * It used to be one debounce timer and a fire-and-forget fetch, which lost
   * answers two different ways. Answering a second question inside the window
   * cleared the first question's timer, so the first answer was never sent at
   * all. And clicking "Finish section" inside the window submitted the attempt
   * before the save left, after which the server correctly refused to write
   * into a closed attempt, so the last answer of a section went missing.
   *
   * Both were invisible: `fetch` only rejects on a network error, so a 409 or a
   * 500 still ran the success branch and the screen said "saved".
   *
   * A map survives both. Nothing is dropped because a later answer arrived, and
   * anything the server refused stays pending to be tried again.
   */
  const pending = useRef<Map<string, number>>(new Map());
  const saveTimer = useRef<number | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const flush = useCallback(async (): Promise<void> => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    /* One flush at a time, so two of them cannot send the same answer twice. */
    if (inFlight.current) await inFlight.current;
    if (!attemptId || pending.current.size === 0) return;

    const batch = [...pending.current.entries()];
    const run = (async () => {
      let failed = false;
      for (const [itemId, optionIndex] of batch) {
        try {
          const response = await fetch('/api/assessment/answer', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ attemptId, itemId, optionIndex }),
          });
          if (response.ok) {
            /* Only drop it once the server has it. */
            if (pending.current.get(itemId) === optionIndex) pending.current.delete(itemId);
          } else {
            failed = true;
            console.error('[assessment] answer refused', response.status, itemId);
          }
        } catch (error) {
          failed = true;
          console.error('[assessment] answer failed', error);
        }
      }
      setSaveState(failed ? 'error' : 'saved');
    })();

    inFlight.current = run;
    await run;
    inFlight.current = null;
  }, [attemptId]);

  const persist = useCallback(
    (itemId: string, optionIndex: number) => {
      if (!attemptId) return;
      pending.current.set(itemId, optionIndex);
      setSaveState('saving');
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      /* The debounce now only delays the batch. It can no longer cancel an
         answer, because the answer is in the map either way. */
      saveTimer.current = window.setTimeout(() => void flush(), 250);
    },
    [attemptId, flush],
  );

  function pick(optionIndex: number) {
    if (!item) return;
    setAnswers((previous) => ({ ...previous, [item.id]: optionIndex }));
    persist(item.id, optionIndex);
  }

  /* A-D keyboard shortcuts. The prototype labels the options with them, so they
     should actually work. */
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const position = KEYS.indexOf(event.key.toUpperCase() as (typeof KEYS)[number]);
      if (position >= 0 && position < (item?.options.length ?? 0)) {
        event.preventDefault();
        pick(position);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  /**
   * Closes this section and moves on. The server decides what comes next and
   * whether the report can be written, because it is the only side that knows
   * which sections are already in.
   */
  async function finishSection() {
    if (!attemptId) {
      router.push(localePath(locale, '/dashboard'));
      return;
    }

    setFinishing(true);
    try {
      /* Write everything outstanding before closing the attempt. Submitting
         first is what used to lose the last answer of every section. */
      await flush();

      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      });

      const body = (await response.json().catch(() => null)) as {
        nextSection?: string | null;
      } | null;

      router.refresh();
      if (body?.nextSection) {
        router.push(localePath(locale, `/assessment?section=${body.nextSection}`));
      } else {
        /* ?offer=1 opens the post-assessment package panel on the dashboard. */
        router.push(localePath(locale, '/dashboard?offer=1'));
      }
    } catch (error) {
      console.error('[assessment] submit failed', error);
      setFinishing(false);
    }
  }

  const sections = a.sections;
  const sectionOrder: SectionId[] = ['skills', 'experience', 'english', 'profile'];
  const sectionPosition = sectionOrder.indexOf(currentSection);

  if (!item) {
    /* Should be unreachable now the runner is keyed per section. Left as a way
       out rather than a dead end: a candidate stuck here mid-assessment with no
       link has to guess a URL. */
    return (
      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(48px,8cqi,96px)]">
        <p className="m-0 mb-5 text-[16px] text-ink-2">
          There are no questions in this section yet.
        </p>
        <button
          type="button"
          onClick={() => router.push(localePath(locale, '/dashboard'))}
          className="t-colors cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-hover"
        >
          Back to your dashboard
        </button>
      </main>
    );
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[clamp(20px,4cqi,56px)] py-[14px]">
        <Mono className="text-muted">{a.header}</Mono>
        <div className="flex items-center gap-3">
          <Mono className="text-muted">
            {fill(a.sectionCounter, { n: sectionPosition + 1, total: sectionOrder.length })}
          </Mono>
          <span className="rounded-full bg-ink px-3 py-1.5 font-mono text-[13px] tabular-nums text-paper">
            {formatClock(left)}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-[220px_1fr]">
        {/* left rail */}
        <nav
          aria-label={a.header}
          className="border-b border-line px-[clamp(20px,4cqi,28px)] py-6 md:border-b-0 md:border-r"
        >
          <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
            {sections.map(([label, meta], position) => {
              const state = position < sectionPosition ? 'done' : position === sectionPosition ? 'now' : 'next';
              return (
                <li
                  key={label}
                  aria-current={state === 'now' ? 'step' : undefined}
                  className={`flex items-start gap-3 rounded-[12px] p-2.5 ${
                    state === 'now' ? 'bg-surface' : 'bg-transparent'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-px flex size-[20px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      state === 'done'
                        ? 'bg-success text-white'
                        : state === 'now'
                          ? 'bg-accent text-white'
                          : 'bg-line text-muted'
                    }`}
                  >
                    {state === 'done' ? '✓' : state === 'now' ? '•' : ''}
                  </span>
                  <span>
                    <span className="block text-[15px] font-medium">{label}</span>
                    <span className="block text-[12px] text-muted">{meta}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* question */}
        <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(28px,4cqi,48px)]">
          <div className="mx-auto max-w-[720px]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <Mono className="text-muted">{item.label}</Mono>
              <Mono className="text-muted">{fill(a.questionCounter, { n: safeIndex + 1, total })}</Mono>
            </div>

            <div className="mb-8 h-1 overflow-hidden rounded-full bg-line-soft">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${((safeIndex + 1) / total) * 100}%` }}
                role="progressbar"
                aria-valuenow={safeIndex + 1}
                aria-valuemin={1}
                aria-valuemax={total}
              />
            </div>

            {item.passage ? (
              <p className="m-0 mb-6 rounded-[16px] border border-line bg-surface p-5 text-[15px] leading-[1.6] text-ink-2">
                {item.passage}
              </p>
            ) : null}

            <h1 className="m-0 mb-7 text-[clamp(22px,2.8cqi,30px)] font-semibold leading-[1.2] tracking-[-0.02em]">
              {item.prompt}
            </h1>

            <div role="radiogroup" aria-label={item.prompt} className="flex flex-col gap-2.5">
              {item.options.map((option, position) => {
                const active = answers[item.id] === position;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => pick(position)}
                    className="t-colors flex cursor-pointer items-start gap-3.5 rounded-[12px] p-4 text-left text-[16px]"
                    style={{
                      border: active ? '2px solid var(--color-ink)' : '1px solid var(--color-line)',
                      background: active ? 'var(--color-surface)' : 'var(--color-surface-subtle)',
                    }}
                  >
                    <Mono className="mt-0.5 shrink-0 text-muted">{KEYS[position]}</Mono>
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIndex(Math.max(0, safeIndex - 1))}
                disabled={safeIndex === 0}
                className="t-colors cursor-pointer rounded-[12px] border border-line-strong bg-surface px-5 py-3 text-[15px] hover:border-ink disabled:opacity-40"
              >
                {a.previous}
              </button>
              <button
                type="button"
                onClick={() => (safeIndex < total - 1 ? setIndex(safeIndex + 1) : finishSection())}
                disabled={finishing}
                className="t-colors cursor-pointer rounded-[12px] border-0 bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-hover disabled:opacity-50"
              >
                {safeIndex < total - 1 ? a.next : a.finish}
              </button>
              <span aria-live="polite" className="font-mono text-[12px] text-muted">
                {saveState === 'saving'
                  ? a.saving
                  : saveState === 'saved'
                    ? a.saved
                    : saveState === 'error'
                      ? a.saveError
                      : ''}
              </span>
            </div>

            <p className="mt-6 mb-0 text-[13px] leading-[1.55] text-muted">{a.autosave}</p>
          </div>
        </main>
      </div>
    </>
  );
}

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
