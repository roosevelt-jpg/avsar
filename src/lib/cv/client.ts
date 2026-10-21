import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic client and the model pinned for CV work.
 *
 * The model id is recorded with every assessment, because a decision taken in
 * October has to remain explainable after the model behind it changes.
 *
 * Cost note: at roughly 20,000 CVs per cohort this is the largest variable cost
 * in the product. CV_MODEL lets that be tuned without touching the pipeline, and
 * the batch path halves it again. See docs/ai-rating.md for the arithmetic.
 */
export const CV_MODEL = process.env.CV_MODEL ?? 'claude-opus-5';

/** Bumped whenever a prompt changes, and stored with every assessment. */
export const PROMPT_VERSION = 'v2-2026-10';

export function isAiConfigured(): boolean {
  return (process.env.ANTHROPIC_API_KEY ?? '').length > 0;
}

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}
