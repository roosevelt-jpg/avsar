import { NextResponse } from 'next/server';
import { z } from 'zod';
import { answerQuestion } from '@/lib/assistant/reply';
import { RATE_LIMITS, clientIp, rateLimit, rateLimitedResponse } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().trim().min(2).max(500),
  thread: z.string().trim().regex(/^[a-zA-Z0-9-]{8,80}$/),
});

/**
 * A question from the site window. The answer is built from site settings and
 * published company notes. The thread id is only a conversation key, never an
 * identity.
 */
export async function POST(request: Request) {
  const limit = await rateLimit(RATE_LIMITS.assistant, clientIp(request));
  if (!limit.ok) return rateLimitedResponse(limit);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  try {
    const result = await answerQuestion({
      question: parsed.data.message,
      threadKey: parsed.data.thread,
      channel: 'web',
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[assistant] failed', error);
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
