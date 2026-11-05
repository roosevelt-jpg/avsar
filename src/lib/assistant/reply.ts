import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';
import { getSiteSettings } from '@/lib/cms/data';
import { refreshIntegrations } from '@/lib/integrations/runtime';
import { anthropic, isAiConfigured } from '@/lib/cv/client';
import type { Locale } from '@/lib/i18n';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import { containsPromise, guardReply } from './guard';
import { companyFacts } from './facts';
import { faqPassages } from './faq';
import {
  assistantFallback,
  assistantLanguageName,
  assistantOff,
  detectAssistantLocale,
  replyMatchesLocale,
} from './language';
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
 * When Anthropic is configured, every visitor-facing line (answer, refusal,
 * handoff) is in the visitor's language — English notes are never returned
 * raw for a Hindi / Tamil / etc. question. When the key is missing, notes may
 * be quoted in English as a last resort.
 */

function systemBase(locale: Locale): string {
  const language = assistantLanguageName(locale);
  return `You answer questions for people considering work in Portugal through this recruitment company. You write the way a careful colleague writes a short WhatsApp message: plain, specific, two or three short sentences, no headings, no "certainly", no mention that you are a model.

You may use only the site settings and the company notes in this request. If they do not contain the answer, set covered to false and leave the reply empty. Do not fill a gap from general knowledge. Do not guess a visa outcome, a job offer, a salary that is not written in the notes, or a fee that is not in the site settings. Never ask for payment in this chat. Payment happens on the website only.

When the visitor has not yet shared their name, city, role interest, or WhatsApp number, ask for one missing item in a short sentence after the answer — never more than one ask per turn.

LANGUAGE (mandatory): Reply entirely in ${language} (locale code ${locale}). The company notes may be English — translating their facts into ${language} is required and allowed. Do not answer in English unless locale is en. Do not mix scripts. If covered is false, leave reply empty (the server fills a localized refusal).

usedTitles must be titles copied from the notes you actually used, including "Site settings" when you used those.`;
}

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
  /** Page locale from the website desk; WhatsApp omits this and we detect from the message. */
  locale?: string | null;
}): Promise<AssistantResult> {
  const question = input.question.replace(/\s+/g, ' ').trim().slice(0, 500);
  const locale = detectAssistantLocale(question, input.locale);
  if (question.length < 2) {
    return { reply: assistantFallback(locale), sources: [], mode: 'ai', threadId: null, escalated: false };
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
      reply: handoffCopy(input.channel, locale),
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
    const reply = handoffCopy(input.channel, locale);
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
  const guarded = await modelOrNotes(question, facts, passages, fromNotes, admin, input.threadKey, agent, locale);

  const uncovered =
    guarded.reply === assistantFallback(locale) ||
    guarded.reply === assistantOff(locale) ||
    guarded.reply === assistantFallback('en') ||
    guarded.reply === assistantOff('en');
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
      const reply = `${guarded.reply} ${handoffCopy(input.channel, locale)}`.trim();
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
  locale: Locale,
): Promise<{ reply: string; sources: string[] }> {
  if (!isAiConfigured()) {
    /* Without Anthropic, English notes are the only honest source. */
    return fromNotes ?? { reply: assistantOff(locale), sources: [] };
  }
  try {
    const modeled = await answerFromModel(question, facts, passages, admin, threadKey, agent, locale);
    const localized = await ensureLocaleReply(modeled, locale, fromNotes);
    if (localized) return localized;
    return modeled;
  } catch (error) {
    console.error('[assistant] model unavailable', error instanceof Error ? error.message : 'unknown');
    if (fromNotes && locale !== 'en') {
      const rendered = await renderNoteInLocale(fromNotes.reply, locale, fromNotes.sources).catch(() => null);
      if (rendered) return rendered;
    }
    return fromNotes && locale === 'en'
      ? fromNotes
      : { reply: assistantFallback(locale), sources: [] };
  }
}

/**
 * Anthropic is on — never hand an English note or English model line to a
 * non-English visitor. Rewrite via the model; if that fails, use the localized refusal.
 */
async function ensureLocaleReply(
  modeled: { reply: string; sources: string[] },
  locale: Locale,
  fromNotes: { reply: string; sources: string[] } | null,
): Promise<{ reply: string; sources: string[] } | null> {
  if (locale === 'en') {
    if (modeled.reply === assistantFallback(locale) && fromNotes) return fromNotes;
    return null;
  }

  const isRefusal =
    modeled.reply === assistantFallback(locale) ||
    modeled.reply === assistantOff(locale) ||
    modeled.reply === assistantFallback('en') ||
    modeled.reply === assistantOff('en');

  if (isRefusal && fromNotes) {
    const rendered = await renderNoteInLocale(fromNotes.reply, locale, fromNotes.sources);
    if (rendered) return rendered;
    return { reply: assistantFallback(locale), sources: [] };
  }

  if (isRefusal) {
    return { reply: assistantFallback(locale), sources: [] };
  }

  if (replyMatchesLocale(modeled.reply, locale)) return null;

  const rewritten = await renderNoteInLocale(modeled.reply, locale, modeled.sources).catch(() => null);
  if (rewritten && replyMatchesLocale(rewritten.reply, locale)) return rewritten;

  if (fromNotes) {
    const fromNote = await renderNoteInLocale(fromNotes.reply, locale, fromNotes.sources).catch(() => null);
    if (fromNote && replyMatchesLocale(fromNote.reply, locale)) return fromNote;
  }

  return { reply: assistantFallback(locale), sources: [] };
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
  locale: Locale,
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
    system: [{ type: 'text', text: systemBase(locale) + focus, cache_control: { type: 'ephemeral' } }],
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
          `Visitor locale: ${locale} (${assistantLanguageName(locale)})`,
          `Question: ${question}`,
        ].join('\n'),
      },
    ],
    output_config: { format: zodOutputFormat(answerSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) return { reply: assistantFallback(locale), sources: [] };
  const cited = allowed.filter((item) => parsed.usedTitles.includes(item.title));
  return guardReply({
    reply: parsed.reply,
    covered: parsed.covered,
    usedTitles: parsed.usedTitles,
    allowedTitles: allowed.map((item) => item.title),
    facts: facts.text,
    locale,
    question,
    sourceText: cited.map((item) => item.content).join('\n'),
  });
}

/**
 * When a matching English note exists but the visitor wrote in another
 * language, Anthropic must render that fact in their language — never skip.
 */
async function renderNoteInLocale(
  english: string,
  locale: Locale,
  sources: string[],
): Promise<{ reply: string; sources: string[] } | null> {
  if (!isAiConfigured() || locale === 'en') return { reply: english, sources };
  const language = assistantLanguageName(locale);
  const response = await anthropic().messages.create({
    model: ASSISTANT_MODEL,
    max_tokens: 500,
    temperature: 0,
    system: `Rewrite into ${language} only (locale ${locale}). Use the correct script for that language. Keep every fact. Add nothing. No English sentences. No greeting, no promise of a job or visa. Plain WhatsApp tone, two or three short sentences.`,
    messages: [{ role: 'user', content: english }],
  });
  const block = response.content.find((part) => part.type === 'text');
  const text = block && block.type === 'text' ? block.text.trim() : '';
  if (!text || containsPromise(text) || !replyMatchesLocale(text, locale)) return null;
  return { reply: text.slice(0, 1200), sources };
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
