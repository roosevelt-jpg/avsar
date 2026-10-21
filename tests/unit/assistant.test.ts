import { describe, expect, it } from 'vitest';
import { chunkNote } from '@/lib/assistant/chunks';
import { ASSISTANT_FALLBACK, guardReply } from '@/lib/assistant/guard';

const facts = 'The optional career package costs ₹2,400. Payment is only on this website.';

describe('company note chunks', () => {
  it('keeps a short note in one piece', () => {
    expect(chunkNote('Refunds are within 14 days.')).toEqual(['Refunds are within 14 days.']);
  });

  it('splits long notes on paragraphs', () => {
    const body = `${'Alpha '.repeat(200)}\n\n${'Beta '.repeat(200)}`;
    const pieces = chunkNote(body);
    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.every((piece) => piece.length <= 4000)).toBe(true);
  });
});

describe('assistant answers stay inside the notes', () => {
  it('keeps a cited answer', () => {
    const result = guardReply({
      reply: 'The package is ₹2,400 and is paid on this website only.',
      covered: true,
      usedTitles: ['Site settings'],
      allowedTitles: ['Site settings', 'Refunds'],
      facts,
    });
    expect(result.reply).toContain('₹2,400');
    expect(result.sources).toEqual(['Site settings']);
  });

  it('refuses when the notes do not cover the question', () => {
    const result = guardReply({
      reply: 'You will probably be fine.',
      covered: false,
      usedTitles: [],
      allowedTitles: ['Site settings'],
      facts,
    });
    expect(result.reply).toBe(ASSISTANT_FALLBACK);
  });

  it('refuses a title the search did not return', () => {
    const result = guardReply({
      reply: 'Your visa is approved.',
      covered: true,
      usedTitles: ['Invented policy'],
      allowedTitles: ['Site settings'],
      facts,
    });
    expect(result.reply).toBe(ASSISTANT_FALLBACK);
  });

  it('refuses a job or visa promise', () => {
    const result = guardReply({
      reply: 'You will get the visa next month.',
      covered: true,
      usedTitles: ['Site settings'],
      allowedTitles: ['Site settings'],
      facts,
    });
    expect(result.reply).toBe(ASSISTANT_FALLBACK);
  });

  it('refuses a price that is not in the settings', () => {
    const result = guardReply({
      reply: 'The fee is ₹9,999.',
      covered: true,
      usedTitles: ['Site settings'],
      allowedTitles: ['Site settings'],
      facts,
    });
    expect(result.reply).toBe(ASSISTANT_FALLBACK);
  });
});
