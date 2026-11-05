import { NextResponse } from 'next/server';
import { z } from 'zod';
import { listActiveAgents, listOnlineStaff, listPersonalAssistants } from '@/lib/assistant/agents';
import { answerQuestion } from '@/lib/assistant/reply';
import { RATE_LIMITS, clientIp, rateLimit, rateLimitedResponse } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().trim().min(2).max(500),
  thread: z.string().trim().regex(/^[a-zA-Z0-9-]{8,80}$/),
  agent: z.string().trim().regex(/^[a-z][a-z0-9-]{1,40}$/).optional(),
  staff: z.string().uuid().optional(),
  personal: z.string().uuid().optional(),
  locale: z.string().trim().max(8).optional(),
});

/** Agent picker + personal assistants + online staff for the floating desk. */
export async function GET() {
  const [agents, staff, personal] = await Promise.all([
    listActiveAgents(),
    listOnlineStaff(),
    listPersonalAssistants(),
  ]);
  const personalIds = new Set(personal.map((person) => person.userId));
  return NextResponse.json({
    agents: agents.map((agent) => ({
      id: agent.id,
      slug: agent.slug,
      displayName: agent.displayName,
      title: agent.title,
      department: agent.department,
      avatarPath: agent.avatarPath,
    })),
    personal: personal.map((person) => ({
      userId: person.userId,
      displayName: person.displayName,
      title: person.title,
      whatsapp: person.whatsapp,
      avatarUrl: person.avatarUrl,
    })),
    /* Online humans who are not already listed as personal assistants. */
    staff: staff
      .filter((person) => !personalIds.has(person.userId))
      .map((person) => ({
        userId: person.userId,
        displayName: person.displayName,
        avatarUrl: person.avatarUrl,
      })),
  });
}

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
      agentSlug: parsed.data.agent,
      staffUserId: parsed.data.staff,
      personalUserId: parsed.data.personal,
      locale: parsed.data.locale,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[assistant] failed', error);
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
