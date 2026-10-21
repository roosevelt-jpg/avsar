import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';
import { anthropic, isAiConfigured } from '@/lib/cv/client';
import { refreshIntegrations } from '@/lib/integrations/runtime';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { BACKGROUND_COLUMNS, backgroundFrom } from '@/lib/candidate/background';
import { DOCUMENT_LABELS, type DocumentKind } from '@/lib/relocation/documents';

/**
 * A first draft of the preliminary legal review, for a member of staff to edit.
 *
 * It may describe only the documents and the background answers on file, plus
 * staff notes. It must not predict a visa. Delivery stays a separate action
 * a person takes after reading the draft.
 */

const SYSTEM = `You draft a preliminary document review for a recruitment candidate. A lawyer or trained staff member will edit it before the candidate sees it.

Use only the file in this request. Where the file is silent, write "Not shown in the file." Do not predict a visa decision, a job, or an approval. Do not invent a document, a date, a refusal, or a law article that is not in the notes. Say that this is a preliminary review of the documents provided, not permission to travel or to work.

Write in plain English the candidate can read. Short paragraphs.`;

const draftSchema = z.object({
  summary: z.string().max(2000),
  requirements: z.string().max(2000),
  missingDocuments: z.string().max(2000),
  issues: z.string().max(2000),
});

export type LegalDraft = z.infer<typeof draftSchema>;

const VISA_PROMISE = /visa (is |will be )?(approved|granted)|you will get the visa|guaranteed visa/i;

export async function draftLegalReview(candidateId: string): Promise<LegalDraft | null> {
  await refreshIntegrations();
  if (!isAiConfigured()) return null;
  const admin = getAdminSupabase();
  if (!admin) return null;

  const [{ data: documents }, { data: background }, { data: notes }] = await Promise.all([
    admin.from('relocation_documents').select('kind, status').eq('candidate_id', candidateId).is('superseded_at', null),
    admin.from('candidate_backgrounds').select(BACKGROUND_COLUMNS).eq('candidate_id', candidateId).maybeSingle(),
    admin.from('knowledge_documents').select('title, body').eq('published', true).order('updated_at', { ascending: false }).limit(12),
  ]);

  const file = [
    'Documents on file:',
    ...(documents ?? []).map((row) => `- ${DOCUMENT_LABELS[row.kind as DocumentKind] ?? row.kind}: ${row.status}`),
    documents?.length ? '' : '- none uploaded',
    '',
    'Background answers (null means not answered, which is not the same as no):',
    JSON.stringify(background ? backgroundFrom(background as unknown as Record<string, unknown>) : null),
    '',
    'Staff notes:',
    ...(notes ?? []).map((note) => `## ${note.title}\n${note.body}`),
  ].join('\n');

  const response = await anthropic().messages.parse({
    model: process.env.ASSISTANT_MODEL || process.env.CV_MODEL || 'claude-sonnet-4-5',
    max_tokens: 2000,
    temperature: 0,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: file }],
    output_config: { format: zodOutputFormat(draftSchema) },
  });

  const draft = response.parsed_output;
  if (!draft) return null;
  return {
    summary: soften(draft.summary),
    requirements: soften(draft.requirements),
    missingDocuments: soften(draft.missingDocuments),
    issues: soften(draft.issues),
  };
}

function soften(text: string): string {
  if (!VISA_PROMISE.test(text)) return text.trim();
  return text.replace(VISA_PROMISE, 'This is not a visa decision.').trim();
}
