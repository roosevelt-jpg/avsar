import { replyStaysOnSource } from './match';

/**
 * The last check before a visitor sees an answer.
 *
 * The model is asked to stay inside the notes. This does not trust that. An
 * answer that cites a note we did not give it, names a price that is not in
 * the settings, or promises a job or a visa is replaced with a plain refusal.
 */

export const ASSISTANT_FALLBACK =
  'I do not have that in the company notes, so I will not guess. A person on the team can answer during office hours. Payment is only on this website.';

export const ASSISTANT_OFF =
  'Written answers are not switched on yet. A person on the team replies on WhatsApp during office hours.';

const PROMISE = /guaranteed (job|visa|offer)|you will (get|receive) (the |a )?(visa|job|offer)|visa (is |will be )?(approved|granted)/i;
const MONEY = /(?:₹|rs\.?|inr|eur|€|aed|\$)\s?\d[\d,]*/gi;

export function containsPromise(text: string): boolean {
  return PROMISE.test(text);
}

export function guardReply(input: {
  reply: string;
  covered: boolean;
  usedTitles: string[];
  allowedTitles: string[];
  facts: string;
  /** When set, an English reply that leaves this text is refused. */
  question?: string;
  sourceText?: string;
}): { reply: string; sources: string[] } {
  const allowed = new Set(input.allowedTitles);
  const sources = input.usedTitles.filter((title) => allowed.has(title));
  const reply = input.reply.trim();
  if (!input.covered || !reply || sources.length !== input.usedTitles.length) {
    return { reply: ASSISTANT_FALLBACK, sources: [] };
  }
  if (PROMISE.test(reply)) return { reply: ASSISTANT_FALLBACK, sources: [] };
  const mentioned = reply.match(MONEY) ?? [];
  const facts = input.facts.toLowerCase().replace(/\s/g, '');
  if (mentioned.some((amount) => !facts.includes(amount.toLowerCase().replace(/\s/g, '')))) {
    return { reply: ASSISTANT_FALLBACK, sources: [] };
  }
  if (
    input.question &&
    input.sourceText &&
    !replyStaysOnSource(input.question, reply, input.sourceText)
  ) {
    return { reply: ASSISTANT_FALLBACK, sources: [] };
  }
  return { reply: reply.slice(0, 1200), sources };
}
