'use client';

import { useEffect, useRef } from 'react';

type TurnstileApi = {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

export { TURNSTILE_HEADER } from '@/lib/security/turnstile';

export const turnstileEnabled = SITE_KEY !== '';

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('turnstile_failed'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Cloudflare's "are you a person" check, in managed mode: most visitors never
 * see a puzzle. Renders nothing when no site key is configured, so demo and
 * local builds are unchanged. A token is single use, so the parent remounts
 * this (change its `key`) after every failed submit to get a fresh one.
 */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  useEffect(() => {
    callback.current = onToken;
  });

  useEffect(() => {
    if (!turnstileEnabled || !ref.current) return;
    const element = ref.current;
    let widgetId: string | null = null;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetId = window.turnstile.render(element, {
          sitekey: SITE_KEY,
          size: 'flexible',
          callback: (token: string) => callback.current(token),
          'expired-callback': () => callback.current(null),
          'error-callback': () => callback.current(null),
        });
      })
      .catch(() => callback.current(null));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  if (!turnstileEnabled) return null;
  return <div ref={ref} className="mt-4 min-h-[65px]" />;
}
