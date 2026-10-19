import type { Locale } from './dictionary';

/** Name of the cookie that remembers the visitor's language choice. */
export const LOCALE_COOKIE = 'avsar_locale';

/**
 * Remembers the chosen language for a later visit to a URL without a locale
 * segment.
 *
 * Kept out of the component because writing to `document.cookie` is a side
 * effect on a global, which the React Compiler rules correctly refuse inside
 * render.
 */
export function rememberLocale(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
