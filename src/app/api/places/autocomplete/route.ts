import { NextResponse } from 'next/server';
import { z } from 'zod';
import { refreshIntegrations } from '@/lib/integrations/runtime';
import { autocompletePlaces, placesConfigured } from '@/lib/places/google';
import { RATE_LIMITS, clientIp, rateLimit, rateLimitedResponse } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  query: z.string().trim().min(2).max(120),
  country: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/)
    .optional(),
  language: z.string().trim().max(12).optional(),
  sessionToken: z.string().trim().max(64).optional(),
});

/**
 * City/town suggestions for the place picker.
 *
 * Proxied so GOOGLE_PLACES_API_KEY stays on the server. Open without a
 * session: sign-up needs it before an account exists.
 */
export async function POST(request: Request) {
  await refreshIntegrations();
  if (!placesConfigured()) {
    return NextResponse.json({ error: 'not_configured', suggestions: [] }, { status: 503 });
  }

  const limited = await rateLimit(RATE_LIMITS.places, clientIp(request));
  if (!limited.ok) return rateLimitedResponse(limited);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload', suggestions: [] }, { status: 400 });

  const suggestions = await autocompletePlaces(parsed.data);
  return NextResponse.json({ suggestions });
}
