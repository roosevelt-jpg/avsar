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
import { getAgentById, getAgentBySlug, type ChatAgent } from './agents';
import {
  ensureThread,
  escalateThread,
  handoffCopy,
  insertTurn,
  mergeIntake,
  visitorAskedForHuman,
  type ChatMode,
} from './threads';

/**
 * One answer for the website and for WhatsApp.
 *
 * The model sees the visitor's question, the recent turns, the site settings,
 * and the notes that actually share the question's words: uploaded documents
 * and the published FAQ. It may not use anything else. guardReply throws the
 * answer away when the citation, the wording, or a promise does not match.
 *
 * When the model is down or has no key, the same notes are used directly.
 * Uncovered answers and human requests escalate the thread to staff.
 */

const SYSTEM_BASE = `You answer questions for people considering work in Portugal through this recruitment company. You write the way a careful colleague writes a short WhatsApp message: plain, specific, two or three short sentences, no headings, no "certainly", no mention that you are a model.

You may use only the site settings and the company notes in this request. If they do not contain the answer, set covered to false and leave the reply empty. Do not fill a gap from general knowledge. Do not guess a visa outcome, a job offer, a salary that is not written in the notes, or a fee that is not in the site settings. Never ask for payment in this chat. Payment happens on the website only.

When the visitor has not yet shared their name, city, role interest, or WhatsApp number, ask for one missing item in a short sentence after the answer — never more than one ask per turn.

Reply in the language the visitor used. Translating a fact that is in the notes is allowed. Adding a fact so the sentence sounds complete is not.

usedTitles must be titles copied from the notes you actually used, including "Site settings" when you used those.`;

const answerSchema = z.object({
  reply: z.string().max(1200),
  covered: z.boolean(),
  usedTitles: z.array(z.string()).max(6),
});

const ASSISTANT_MODEL = process.env.ASSISTANT_MODEL || process.env.CV_MODEL || 'claude-sonnet-4-5';

export type AssistantChannel = 'web' | 'whatsapp';

export type AssistantResult = {
  reply: string;
  sources: string[];
  mode: ChatMode;
  threadId: string | null;
  escalated: boolean;
};

export async function answerQuestion(input: {
  question: string;
  threadKey: string;
  channel: AssistantChannel;
  externalId?: string | null;
  agentSlug?: string | null;
  agentId?: string | null;
  staffUserId?: string | null;
}): Promise<AssistantResult> {
  const question = input.question.replace(/\s+/g, ' ').trim().slice(0, 500);
  if (question.length < 2) {
    return { reply: ASSISTANT_FALLBACK, sources: [], mode: 'ai', threadId: null, escalated: false };
  }
  await refreshIntegrations();

  const agent =
    (input.agentId ? await getAgentById(input.agentId) : null) ||
    (input.agentSlug ? await getAgentBySlug(input.agentSlug) : null) ||
    (await getAgentBySlug('general'));

  let thread = await ensureThread({
    publicKey: input.threadKey,
    channel: input.channel,
    agent,
    assigneeUserId: input.staffUserId,
    forceHuman: Boolean(input.staffUserId),
  });

  if (thread) thread = await mergeIntake(thread, question);

  /* Visitor already in human mode: park the message for staff, do not re-run AI. */
  if (thread && thread.mode === 'human') {
    await insertTurn({
      thread,
      channel: input.channel,
      role: 'user',
      body: question,
      agentId: agent?.id,
      externalId: input.externalId,
    });
    const { notifyStaff } = await import('@/lib/notifications/staff');
    await notifyStaff({
      permission: 'leads.manage',
      kind: 'chat.visitor',
      title: 'New message in live chat',
      body: question.slice(0, 200),
      href: `/admin/chat?thread=${thread.id}`,
    });
    return {
      reply: handoffCopy(input.channel),
      sources: [],
      mode: 'human',
      threadId: thread.id,
      escalated: false,
    };
  }

  const wantHuman = visitorAskedForHuman(question) || Boolean(input.staffUserId);
  if (wantHuman && thread) {
    await insertTurn({
      thread,
      channel: input.channel,
      role: 'user',
      body: question,
      agentId: agent?.id,
      externalId: input.externalId,
    });
    thread = await escalateThread(thread, question);
    const reply = handoffCopy(input.channel);
    await insertTurn({
      thread,
      channel: input.channel,
      role: 'assistant',
      body: reply,
      agentId: agent?.id,
    });
    return { reply, sources: [], mode: 'human', threadId: thread.id, escalated: true };
  }

  const settings = await getSiteSettings();
  const facts = companyFacts(settings, settings.pricing, settings.hiring);
  const passages = await passagesFor(question, { title: facts.title, content: facts.text }, settings, agent);
  const fromNotes = quoteFromNotes(question, passages);

  const admin = getAdminSupabase();
  const guarded = await modelOrNotes(question, facts, passages, fromNotes, admin, input.threadKey, agent);

  const uncovered = guarded.reply === ASSISTANT_FALLBACK || guarded.reply === ASSISTANT_OFF;
  let escalated = false;
  let mode: ChatMode = 'ai';

  if (thread) {
    await insertTurn({
      thread,
      channel: input.channel,
      role: 'user',
      body: question,
      agentId: agent?.id,
      externalId: input.externalId,
    });

    if (uncovered) {
      thread = await escalateThread(thread, question);
      escalated = true;
      mode = 'human';
      const reply = `${guarded.reply} ${handoffCopy(input.channel)}`.trim();
      await insertTurn({
        thread,
        channel: input.channel,
        role: 'assistant',
        body: reply,
        sources: guarded.sources,
        agentId: agent?.id,
      });
      return { reply, sources: guarded.sources, mode, threadId: thread.id, escalated };
    }

    await insertTurn({
      thread,
      channel: input.channel,
      role: 'assistant',
      body: guarded.reply,
      sources: guarded.sources,
      agentId: agent?.id,
    });
  }

  return {
    reply: guarded.reply,
    sources: guarded.sources,
    mode,
    threadId: thread?.id ?? null,
    escalated,
  };
}

async function modelOrNotes(
  question: string,
  facts: { title: string; text: string },
  passages: Passage[],
  fromNotes: { reply: string; sources: string[] } | null,
  admin: ReturnType<typeof getAdminSupabase>,
  threadKey: string,
  agent: ChatAgent | null,
): Promise<{ reply: string; sources: string[] }> {
  if (!isAiConfigured()) return fromNotes ?? { reply: ASSISTANT_OFF, sources: [] };
  try {
    const modeled = await answerFromModel(question, facts, passages, admin, threadKey, agent);
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
  agent: ChatAgent | null,
): Promise<Passage[]> {
  const [notes, faqs] = await Promise.all([publicNotes(question, agent?.knowledgeTags ?? []), faqPassages(settings)]);
  return [facts, ...notes, ...faqs];
}

async function answerFromModel(
  question: string,
  facts: { title: string; text: string },
  passages: Passage[],
  admin: ReturnType<typeof getAdminSupabase>,
  threadKey: string,
  agent: ChatAgent | null,
): Promise<{ reply: string; sources: string[] }> {
  const notes = supportingPassages(question, passages);
  const allowed = [{ title: facts.title, content: facts.text }, ...notes];
  const history = admin ? await recentTurns(admin, threadKey) : [];
  const focus = agent?.systemFocus
    ? `\n\nYou are ${agent.displayName}, ${agent.title} (${agent.department}). Stay inside this focus:\n${agent.systemFocus}`
    : '';
  const response = await anthropic().messages.parse({
    model: ASSISTANT_MODEL,
    max_tokens: 600,
    temperature: 0,
    system: [{ type: 'text', text: SYSTEM_BASE + focus, cache_control: { type: 'ephemeral' } }],
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

async function publicNotes(question: string, tags: string[]): Promise<{ title: string; content: string }[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const args: { query: string; tag_filter?: string[] } = { query: question };
  if (tags.length > 0) args.tag_filter = tags;
  const { data, error } = await supabase.rpc('search_public_knowledge', args);
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
