import { NextResponse } from 'next/server';
import { z } from 'zod';
import { chunkNote } from '@/lib/assistant/chunks';
import { audit } from '@/lib/audit';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

const noteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(100_000),
});

const saveSchema = noteSchema.extend({
  audience: z.enum(['public', 'staff']),
});

const uploadSchema = z.object({
  audience: z.enum(['public', 'staff']),
  documents: z
    .array(
      noteSchema.extend({
        filename: z.string().trim().regex(/^[^/\\]+\.md$/i),
      }),
    )
    .min(1)
    .max(20),
});

/** Saves a typed note, or a batch of Markdown training documents. */
export async function POST(request: Request) {
  const guard = await apiPermission('cms.edit');
  if (guard instanceof NextResponse) return guard;
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const json = await request.json().catch(() => null);
  const uploaded = uploadSchema.safeParse(json);
  const notes = uploaded.success
    ? uploaded.data.documents.map((document) => ({ title: document.title, body: document.body, audience: uploaded.data.audience }))
    : saveSchema.safeParse(json).success
      ? [saveSchema.parse(json)]
      : null;
  if (!notes) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const ids: string[] = [];
  for (const note of notes) {
    const { data, error } = await admin
      .from('knowledge_documents')
      .insert({
        title: note.title,
        body: note.body,
        audience: note.audience,
        published: true,
        updated_by: guard.userId,
      })
      .select('id')
      .single();
    if (error || !data) return NextResponse.json({ error: 'save_failed', saved: ids.length }, { status: 500 });

    const pieces = chunkNote(note.body);
    if (pieces.length > 0) {
      const { error: chunkError } = await admin.from('knowledge_chunks').insert(
        pieces.map((content, ordinal) => ({ document_id: data.id, ordinal, content })),
      );
      if (chunkError) return NextResponse.json({ error: 'save_failed', saved: ids.length }, { status: 500 });
    }
    ids.push(String(data.id));
    await audit(guard.userId, 'assistant.note_save', `knowledge:${data.id}`, { title: note.title, audience: note.audience });
  }

  return NextResponse.json({ id: ids[0] ?? null, saved: ids.length });
}

export async function DELETE(request: Request) {
  const guard = await apiPermission('cms.edit');
  if (guard instanceof NextResponse) return guard;
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { error } = await admin.from('knowledge_documents').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  await audit(guard.userId, 'assistant.note_delete', `knowledge:${id}`);
  return NextResponse.json({ ok: true });
}
