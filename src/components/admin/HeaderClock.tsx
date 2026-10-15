'use client';

import { useSyncExternalStore } from 'react';

/* One shared ticker, aligned to the minute, so the clock never lags the
   real time by more than a second and idle tabs do almost no work. */
function subscribe(onTick: () => void) {
  let interval: ReturnType<typeof setInterval> | undefined;
  const timeout = setTimeout(() => {
    onTick();
    interval = setInterval(onTick, 60_000);
  }, 60_000 - (Date.now() % 60_000));
  return () => {
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
  };
}

const minute = () => Math.floor(Date.now() / 60_000);

/**
 * Today's date and the time, in the viewer's own time zone. Rendered only in
 * the browser: the server does not know where the viewer is, and printing its
 * own clock would show staff in Dubai and Lisbon the wrong time.
 */
export function HeaderClock() {
  const now = useSyncExternalStore(subscribe, minute, () => null);
  if (now === null) return <span className="h-5 w-40" aria-hidden />;

  const date = new Date(now * 60_000);
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return (
    <time dateTime={date.toISOString()} className="flex items-center gap-2 text-[14px] text-ink-2">
      <svg viewBox="0 0 24 24" className="size-4 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
      <span>{day}</span>
      <span aria-hidden className="text-line-strong">·</span>
      <span className="font-mono tabular-nums text-ink">{time}</span>
    </time>
  );
}
