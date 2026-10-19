/**
 * Client-safe EximPe constants and types.
 *
 * Separate from the adapter because that one imports node:crypto and must never
 * reach a browser bundle.
 */

/**
 * Pinned version, with the integrity hash EximPe publishes alongside it.
 *
 * Both move together: a new version needs its own hash, and a mismatched pair
 * means the browser refuses the script rather than running an unverified one.
 * That is the point, and it is why the version is not floated.
 */
export const EXIMPE_SDK_SRC = 'https://cdn.eximpe.com/sdk/eximpe-sdk-1.4.0.min.js';
export const EXIMPE_SDK_INTEGRITY =
  'sha384-rvrIcrtaUS0sEFb/PFFvzNM4ZpoEjw9Jsa1BixxtJ2dGZxWA3UQ8gbDvDpUBWzKL';

export type EximpeInstance = {
  checkout(options: {
    sessionId: string;
    redirectTarget?: '_self' | '_blank';
  }): Promise<unknown>;
};

type EximpeConstructor = new (options: { mode: 'sandbox' | 'production' }) => EximpeInstance;

/** Loads the SDK once and returns an instance. */
export async function loadEximpe(mode: 'sandbox' | 'production'): Promise<EximpeInstance> {
  const existing = (window as unknown as { Eximpe?: EximpeConstructor }).Eximpe;
  if (existing) return new existing({ mode });

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = EXIMPE_SDK_SRC;
    /* Subresource integrity, so a compromised CDN cannot quietly serve a
       different script to a page that is about to take a payment. */
    script.integrity = EXIMPE_SDK_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('eximpe_sdk_failed'));
    document.head.appendChild(script);
  });

  const Constructor = (window as unknown as { Eximpe?: EximpeConstructor }).Eximpe;
  if (!Constructor) throw new Error('eximpe_sdk_missing');
  return new Constructor({ mode });
}
