import { str, type Block } from '@/lib/cms/blocks';
import { getPublishedPage } from '@/lib/cms/data';
import { applyTokensDeep, tokenValues } from '@/lib/cms/tokens';
import type { SiteSettings } from '@/lib/cms/settings';
import type { Passage } from './match';

/**
 * The FAQ a visitor can already read, as passages the assistant may quote.
 *
 * Home and the FAQ page are both included, with the same token values the
 * page itself uses, so a price in the answer is the price from Settings.
 */
export async function faqPassages(settings: SiteSettings): Promise<Passage[]> {
  try {
    const pages = await Promise.all([getPublishedPage('faq', 'en'), getPublishedPage('home', 'en')]);
    const values = tokenValues(settings);
    const passages: Passage[] = [];
    for (const page of pages) {
      if (!page) continue;
      for (const block of page.blocks) passages.push(...faqBlock(block, values));
    }
    return passages;
  } catch (error) {
    console.error('[assistant] faq read failed', error);
    return [];
  }
}

function faqBlock(block: Block, values: Record<string, string>): Passage[] {
  if (block.hidden || block.type !== 'faq') return [];
  const data = applyTokensDeep(block.data, values);
  const items = data.items;
  if (!Array.isArray(items)) return [];
  const passages: Passage[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const question = str(row, 'question').trim();
    const answer = str(row, 'answer').trim();
    if (!question || !answer) continue;
    passages.push({
      title: `FAQ: ${question}`.slice(0, 200),
      content: `${question} ${answer}`.slice(0, 4000),
    });
  }
  return passages;
}
