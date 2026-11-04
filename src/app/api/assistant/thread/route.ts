import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getThreadByPublicKey, listThreadMessages } from '@/lib/assistant/threads';
import { RATE_LIMITS, clientIp, rateLimit, rateLimitedResponse } from '@/lib/security/rate-limit';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const querySchema = z.object({
  key: z.string().trim().regex(/^[a-zA-Z0-9-]{8,80}$/),
  after: z.coerce.number().int().min(0).optional(),
});

/**
 * Visitor poll while a human owns the thread. Returns only messages for the
 * public session key — never staff-only fields beyond display names on staff
 * bubbles.
 */
export async function GET(request: Request) {
  const limit = await rateLimit(RATE_LIMITS.assistant, clientIp(request));
  if (!limit.ok) return rateLimitedResponse(limit);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    key: url.searchParams.get('key'),
    after: url.searchParams.get('after') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const thread = await getThreadByPublicKey(parsed.data.key);
  if (!thread) return NextResponse.json({ mode: 'ai', threadId: null, messages: [] });

  const messages = await listThreadMessages(thread.id, parsed.data.after ?? 0);
  const staffIds = [...new Set(messages.filter((m) => m.senderUserId).map((m) => m.senderUserId!))];
  const profiles = new Map<string, { name: string; avatar: string }>();
  if (staffIds.length > 0) {
    const admin = getAdminSupabase();
    if (admin) {
      const { data } = await admin.from('staff_presence').select('user_id, display_name, avatar_url').in('user_id', staffIds);
      for (const row of data ?? []) {
        profiles.set(String(row.user_id), {
          name: String(row.display_name || 'Recruiter'),
          avatar: String(row.avatar_url || ''),
        });
      }
    }
  }

  return NextResponse.json({
    mode: thread.mode,
    threadId: thread.id,
    needsHuman: thread.needsHuman,
    messages: messages.map((message) => {
      const profile = message.senderUserId ? profiles.get(message.senderUserId) : null;
      return {
        id: message.id,
        role: message.role,
        body: message.body,
        sources: message.sources,
        senderName: profile?.name ?? (message.role === 'assistant' ? 'Assistant' : ''),
        senderAvatar: profile?.avatar ?? '',
        createdAt: message.createdAt,
      };
    }),
  });
}
