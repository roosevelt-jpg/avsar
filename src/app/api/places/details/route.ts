import { NextResponse } from 'next/server';
import { z } from 'zod';
import { refreshIntegrations } from '@/lib/integrations/runtime';
import { placeDetails, placesConfigured } from '@/lib/places/google';
import { RATE_LIMITS, clientIp, rateLimit, rateLimitedResponse } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  placeId: z.string().trim().min(3).max(256),
  language: z.string().trim().max(12).optional(),
  sessionToken: z.string().trim().max(64).optional(),
});

/** Resolves a Places prediction into a compact city/state/country string. */
export async function POST(request: Request) {
  await refreshIntegrations();
  if (!placesConfigured()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const limited = await rateLimit(RATE_LIMITS.places, clientIp(request));
  if (!limited.ok) return rateLimitedResponse(limited);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const place = await placeDetails(parsed.data);
  if (!place) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(place);
}
