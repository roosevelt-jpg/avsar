import { anthropic, CV_MODEL, isAiConfigured } from './client';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { extractionSchema } from './schema';

/**
 * Batch extraction, for cohort-scale volume.
 *
 * The Batches API runs asynchronously at half price, which matters at 20,000
 * CVs. It is used for the extraction pass, which is the expensive one because it
 * carries the document. The rating pass runs afterwards on the extracted JSON,
 * which is small.
 *
 * Limits: 100,000 requests or 256 MB per batch, most complete within an hour,
 * 24 hours maximum, results kept 29 days. A 256 MB cap means roughly 300-400
 * base64 PDFs per batch in practice, so chunk accordingly.
 */

const SYSTEM = `You extract structured data from a job candidate's CV. You do not evaluate, score or rank the candidate.

Record only what the document says. Never infer a qualification, date or duty that is not written. Fill protectedAttributes with anything the document volunteers about identity, so that a later step can exclude it; return an empty string for anything absent, and never infer gender, religion or caste from a name.`;

export type BatchItem = { candidateId: string; pdfBase64: string };

/** Submits an extraction batch. Returns the batch id to poll. */
export async function submitExtractionBatch(items: readonly BatchItem[]): Promise<string> {
  if (!isAiConfigured()) throw new Error('ANTHROPIC_API_KEY is not set');

  const batch = await anthropic().messages.batches.create({
    requests: items.map((item) => ({
      custom_id: item.candidateId,
      params: {
        model: CV_MODEL,
        max_tokens: 16000,
        thinking: { type: 'adaptive' as const },
        system: SYSTEM,
        messages: [
          {
            role: 'user' as const,
            content: [
              {
                type: 'document' as const,
                source: {
                  type: 'base64' as const,
                  media_type: 'application/pdf' as const,
                  data: item.pdfBase64,
                },
              },
              { type: 'text' as const, text: 'Extract the structured data from this CV.' },
            ],
          },
        ],
        output_config: { format: zodOutputFormat(extractionSchema) },
      },
    })),
  });

  return batch.id;
}

export type BatchProgress = {
  status: string;
  succeeded: number;
  errored: number;
  processing: number;
  ended: boolean;
};

export async function batchProgress(batchId: string): Promise<BatchProgress> {
  const batch = await anthropic().messages.batches.retrieve(batchId);
  return {
    status: batch.processing_status,
    succeeded: batch.request_counts.succeeded,
    errored: batch.request_counts.errored,
    processing: batch.request_counts.processing,
    ended: batch.processing_status === 'ended',
  };
}

export type BatchOutcome =
  | { candidateId: string; ok: true; raw: string }
  | { candidateId: string; ok: false; reason: string; retryable: boolean };

/**
 * Reads a finished batch.
 *
 * Results arrive in any order, so they are keyed by `custom_id`. Never by
 * position: pairing a rating to the wrong candidate is the one bug in this
 * pipeline that would be both silent and serious.
 */
export async function collectBatch(batchId: string): Promise<BatchOutcome[]> {
  const out: BatchOutcome[] = [];

  for await (const result of await anthropic().messages.batches.results(batchId)) {
    const candidateId = result.custom_id;

    if (result.result.type === 'succeeded') {
      const text = result.result.message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('');
      out.push({ candidateId, ok: true, raw: text });
      continue;
    }

    if (result.result.type === 'errored') {
      /* `error` is an ErrorResponse envelope, so the useful discriminator is one
         level in: result.error.error.type. */
      const kind = result.result.error.error.type;
      out.push({
        candidateId,
        ok: false,
        reason: kind,
        /* A malformed request will fail again identically; everything else
           (rate limits, overload, transient api errors) is worth retrying. */
        retryable: kind !== 'invalid_request_error',
      });
      continue;
    }

    out.push({ candidateId, ok: false, reason: result.result.type, retryable: true });
  }

  return out;
}
