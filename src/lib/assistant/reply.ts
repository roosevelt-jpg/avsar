import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';
import { getSiteSettings } from '@/lib/cms/data';
import { refreshIntegrations } from '@/lib/integrations/runtime';
import { anthropic, isAiConfigured } from '@/lib/cv/client';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { ASSISTANT_FALLBACK, ASSISTANT_OFF, containsPromise, guardReply } from './guard';
import { companyFacts } from './facts';
import { faqPassages } from './faq';
import { quoteMatch, supportingPassages, type Passage } from './match';

/**
 * One answer for the website and for WhatsApp.
 *
 * The model sees the visitor's question, the recent turns, the site settings,
 * and the notes that actually share the question's words: uploaded documents
 * and the published FAQ. It may not use anything else. guardReply throws the
 * answer away when the citation, the wording, or a promise does not match.
 *
 * When the model is down or has no key, the same notes are used directly.
 * One matching sentence is quoted. If nothing matches, or two notes match
 * equally, the reply says it does not know.
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

  const settings = await getSiteSettings();
  const facts = companyFacts(settings, settings.pricing, settings.hiring);
  const passages = await passagesFor(question, { title: facts.title, content: facts.text }, settings);
  const fromNotes = quoteFromNotes(question, passages);

  const admin = getAdminSupabase();
  const guarded = await modelOrNotes(question, facts, passages, fromNotes, admin, input.threadKey);

  if (admin) {
    await admin.from('assistant_messages').insert([
      { channel: input.channel, thread_key: input.threadKey, role: 'user', body: question, external_id: input.externalId ?? null },
      { channel: input.channel, thread_key: input.threadKey, role: 'assistant', body: guarded.reply, sources: guarded.sources },
    ]);
  }

  return guarded;
}

async function modelOrNotes(
  question: string,
  facts: { title: string; text: string },
  passages: Passage[],
  fromNotes: { reply: string; sources: string[] } | null,
  admin: ReturnType<typeof getAdminSupabase>,
  threadKey: string,
): Promise<{ reply: string; sources: string[] }> {
  if (!isAiConfigured()) return fromNotes ?? { reply: ASSISTANT_OFF, sources: [] };
  try {
    const modeled = await answerFromModel(question, facts, passages, admin, threadKey);
    /* A wandered answer is already replaced with the refusal. A matching
       sentence from the notes is more useful than that refusal, and it is
       still the note, not a guess. */
    if (modeled.reply === ASSISTANT_FALLBACK && fromNotes) return fromNotes;
    return modeled;
  } catch (error) {
    console.error('[assistant] model unavailable', error instanceof Error ? error.message : 'unknown');
    return fromNotes ?? { reply: ASSISTANT_FALLBACK, sources: [] };
  }
}

function quoteFromNotes(question: string, passages: Passage[]): { reply: string; sources: string[] } | null {
  const quoted = quoteMatch(question, passages);
  if (!quoted || containsPromise(quoted.content)) return null;
  return { reply: quoted.content, sources: [quoted.title] };
}

async function passagesFor(
  question: string,
  facts: Passage,
  settings: Awaited<ReturnType<typeof getSiteSettings>>,
): Promise<Passage[]> {
  const [notes, faqs] = await Promise.all([publicNotes(question), faqPassages(settings)]);
  return [facts, ...notes, ...faqs];
}

async function answerFromModel(
  question: string,
  facts: { title: string; text: string },
  passages: Passage[],
  admin: ReturnType<typeof getAdminSupabase>,
  threadKey: string,
): Promise<{ reply: string; sources: string[] }> {
  const notes = supportingPassages(question, passages);
  const allowed = [{ title: facts.title, content: facts.text }, ...notes];
  const history = admin ? await recentTurns(admin, threadKey) : [];
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
  if (!parsed) return { reply: ASSISTANT_FALLBACK, sources: [] };
  const cited = allowed.filter((item) => parsed.usedTitles.includes(item.title));
  return guardReply({
    reply: parsed.reply,
    covered: parsed.covered,
    usedTitles: parsed.usedTitles,
    allowedTitles: allowed.map((item) => item.title),
    facts: facts.text,
    question,
    sourceText: cited.map((item) => item.content).join('\n'),
  });
}

async function publicNotes(question: string): Promise<{ title: string; content: string }[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('search_public_knowledge', { query: question });
  if (error) {
    console.error('[assistant] note search failed', error.message);
    return [];
  }
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
