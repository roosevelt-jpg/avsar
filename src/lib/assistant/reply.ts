import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';
import { getSiteSettings } from '@/lib/cms/data';
import { refreshIntegrations } from '@/lib/integrations/runtime';
import { anthropic, isAiConfigured } from '@/lib/cv/client';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { ASSISTANT_FALLBACK, ASSISTANT_OFF, guardReply } from './guard';
import { companyFacts } from './facts';

/**
 * One answer for the website and for WhatsApp.
 *
 * The model sees the visitor's question, the recent turns, the site settings,
 * and up to six passages from published public notes. It may not use anything
 * else. guardReply throws the answer away when the citation or a promise
 * does not match what we handed over.
 */

const SYSTEM = `You answer questions for people considering work in Portugal through this recruitment company. You write the way a careful colleague writes a short WhatsApp message: plain, specific, two or three short sentences, no headings, no "certainly", no mention that you are a model.

You may use only the site settings and the company notes in this request. If they do not contain the answer, set covered to false and leave the reply empty. Do not fill a gap from general knowledge. Do not guess a visa outcome, a job offer, a salary that is not written in the notes, or a fee that is not in the site settings. Never ask for payment in this chat. Payment happens on the website only.

Reply in the language the visitor used. Translating a fact that is in the notes is allowed. Adding a fact so the sentence sounds complete is not.

usedTitles must be titles copied from the notes you actually used, including "Site settings" when you used those.`;

const answerSchema = z.object({
  reply: z.string().max(1200),
  covered: z.boolean(),
  usedTitles: z.array(z.string()).max(6),
});

const ASSISTANT_MODEL = process.env.ASSISTANT_MODEL || process.env.CV_MODEL || 'claude-sonnet-4-5';

export type AssistantChannel = 'web' | 'whatsapp';

export async function answerQuestion(input: {
  question: string;
  threadKey: string;
  channel: AssistantChannel;
  externalId?: string | null;
}): Promise<{ reply: string; sources: string[] }> {
  const question = input.question.replace(/\s+/g, ' ').trim().slice(0, 500);
  if (question.length < 2) return { reply: ASSISTANT_FALLBACK, sources: [] };
  await refreshIntegrations();
  if (!isAiConfigured()) return { reply: ASSISTANT_OFF, sources: [] };

  const settings = await getSiteSettings();
  const facts = companyFacts(settings, settings.pricing, settings.hiring);
  const notes = await publicNotes(question);
  const allowed = [facts, ...notes];

  const admin = getAdminSupabase();
  const history = admin ? await recentTurns(admin, input.threadKey) : [];

  const response = await anthropic().messages.parse({
    model: ASSISTANT_MODEL,
    max_tokens: 600,
    temperature: 0,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [
      ...history,
      {
        role: 'user',
        content: [
          `Site settings:\n${facts.text}`,
          '',
          notes.length
            ? notes.map((note) => `Note titled "${note.title}":\n${note.content}`).join('\n\n')
            : 'No company note matched this question.',
          '',
          `Question: ${question}`,
        ].join('\n'),
      },
    ],
    output_config: { format: zodOutputFormat(answerSchema) },
  });

  const parsed = response.parsed_output;
  const guarded = parsed
    ? guardReply({
        reply: parsed.reply,
        covered: parsed.covered,
        usedTitles: parsed.usedTitles,
        allowedTitles: allowed.map((item) => item.title),
        facts: facts.text,
      })
    : { reply: ASSISTANT_FALLBACK, sources: [] };

  if (admin) {
    await admin.from('assistant_messages').insert([
      { channel: input.channel, thread_key: input.threadKey, role: 'user', body: question, external_id: input.externalId ?? null },
      { channel: input.channel, thread_key: input.threadKey, role: 'assistant', body: guarded.reply, sources: guarded.sources },
    ]);
  }

  return guarded;
}

async function publicNotes(question: string): Promise<{ title: string; content: string }[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.rpc('search_public_knowledge', { query: question });
  return ((data ?? []) as { title: string; content: string }[]).filter((row) => row.title && row.content);
}

async function recentTurns(
  admin: NonNullable<ReturnType<typeof getAdminSupabase>>,
  threadKey: string,
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  const { data } = await admin
    .from('assistant_messages')
    .select('role, body')
    .eq('thread_key', threadKey)
    .order('created_at', { ascending: false })
    .limit(6);
  const turns = (data ?? [])
    .reverse()
    .filter((row) => row.role === 'user' || row.role === 'assistant')
    .map((row) => ({ role: row.role as 'user' | 'assistant', content: String(row.body) }));
  while (turns[0]?.role === 'assistant') turns.shift();
  if (turns.at(-1)?.role === 'user') turns.pop();
  return turns;
}
