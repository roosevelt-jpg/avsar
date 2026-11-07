/**
 * Lightweight marketing-preference store for the public site.
 * Essential cookies (auth, locale) are always on; only optional marketing
 * embeds (YouTube) are gated. No analytics categories we do not use.
 */

export const CONSENT_STORAGE_KEY = 'sa_consent_prefs_v1';

export type ConsentPrefs = {
  /** Visitor has answered the banner (accept or custom save). */
  decided: boolean;
  /** Optional marketing embeds such as YouTube players. */
  marketing: boolean;
};

export const DEFAULT_CONSENT: ConsentPrefs = { decided: false, marketing: false };

/**
 * Cached snapshot for useSyncExternalStore. Returning a fresh object from
 * getSnapshot every call makes React think the store changed on every render
 * and loops until the root error boundary replaces the page.
 */
let cachedRaw: string | null | undefined;
let cachedPrefs: ConsentPrefs = DEFAULT_CONSENT;

function parsePrefs(raw: string | null): ConsentPrefs {
  if (!raw) return DEFAULT_CONSENT;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentPrefs>;
    return {
      decided: Boolean(parsed.decided),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function readConsentPrefs(): ConsentPrefs {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw === cachedRaw) return cachedPrefs;
    cachedRaw = raw;
    cachedPrefs = parsePrefs(raw);
    return cachedPrefs;
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function writeConsentPrefs(prefs: ConsentPrefs): void {
  if (typeof window === 'undefined') return;
  const raw = JSON.stringify(prefs);
  window.localStorage.setItem(CONSENT_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedPrefs = prefs;
  window.dispatchEvent(new CustomEvent('sa:consent', { detail: prefs }));
}

export function marketingAllowed(): boolean {
  const prefs = readConsentPrefs();
  return prefs.decided && prefs.marketing;
}
