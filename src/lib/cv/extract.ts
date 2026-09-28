import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { anthropic, CV_MODEL, PROMPT_VERSION } from './client';
import { extractionSchema, type Extraction } from './schema';

/**
 * Pass 1: read the document and return structure. No judgement, no scoring.
 *
 * Separating extraction from rating is what makes the rest of the pipeline
 * defensible: only this pass sees identity, and its output is a factual record
 * a human can check against the original document.
 */

const SYSTEM = `You extract structured data from a job candidate's CV. You do not evaluate, score or rank the candidate. That happens in a separate step.

Rules:
- Record only what the document says. Never infer a qualification, a date or a duty that is not written.
- Where a date is partial, return what is given. Where it is absent, return an empty string.
- Compute totalYearsExperience from the role dates, excluding overlapping periods. If dates are too incomplete, return 0 and say so in extractionNotes.
- Fill protectedAttributes with anything the document volunteers about name, contact, age, date of birth, gender, marital status, religion, caste, nationality or a photograph. These are collected so that a later step can exclude them. Return an empty string for anything absent. Never guess any of them, and in particular never infer gender, religion or caste from a name.
- Employment gaps: only periods of three months or more between roles.
- If a section is unreadable, say which in extractionNotes and set documentQuality accordingly rather than guessing at the content.`;

export type ExtractionResult = {
  extraction: Extraction;
  usage: { inputTokens: number; outputTokens: number };
  model: string;
  promptVersion: string;
};

export async function extractCv(input: {
  /** Base64 PDF, or plain text when the CV arrived as text. */
  pdfBase64?: string;
  text?: string;
}): Promise<ExtractionResult> {
  if (!input.pdfBase64 && !input.text) throw new Error('extractCv needs a pdfBase64 or text input');

  const content: Anthropic.ContentBlockParam[] = [];
  if (input.pdfBase64) {
    /* The document block goes before the instruction: the model reads better
       when the material precedes the task. */
    content.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: input.pdfBase64 },
    });
  }
  content.push({
    type: 'text',
    text: input.text
      ? `Extract the structured data from this CV.\n\n---\n${input.text}\n---`
      : 'Extract the structured data from this CV.',
  });

  const response = await anthropic().messages.parse({
    model: CV_MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content }],
    output_config: { format: zodOutputFormat(extractionSchema) },
  });

  if (!response.parsed_output) {
    throw new Error(`Extraction returned no parsed output (stop_reason: ${response.stop_reason})`);
  }

  return {
    extraction: response.parsed_output,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    model: CV_MODEL,
    promptVersion: PROMPT_VERSION,
  };
}
