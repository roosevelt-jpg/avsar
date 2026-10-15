/**
 * Cloudflare Turnstile, verified server side.
 *
 * Only account creation is challenged: it is the one anonymous write that costs
 * us something (an auth user, a candidate row, a verification email). Without
 * a secret configured the check passes, so local development needs no keys. Setting the secret without the public site key would refuse
 * every registration, so the two are set together.
 */

import { refreshIntegrations } from '@/lib/integrations/runtime';

export const TURNSTILE_HEADER = 'x-turnstile-token';

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
  await refreshIntegrations();
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'unknown') body.set('remoteip', ip);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      cache: 'no-store',
    });
    const data = (await response.json().catch(() => null)) as { success?: boolean } | null;
    return data?.success === true;
  } catch (error) {
    /* Fails closed, unlike the rate limiter: if Cloudflare cannot be reached
       we cannot tell a person from a script, and the candidate can retry. */
    console.error('[turnstile] verify failed', error);
    return false;
  }
}
