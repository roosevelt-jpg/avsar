import { NextResponse } from 'next/server';
import { z } from 'zod';
import { chunkNote } from '@/lib/assistant/chunks';
import { audit } from '@/lib/audit';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

const saveSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(100_000),
  audience: z.enum(['public', 'staff']),
});

/** Saves a company note and the passages the assistant searches. */
export async function POST(request: Request) {
  const guard = await apiPermission('cms.edit');
  if (guard instanceof NextResponse) return guard;
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data, error } = await admin
    .from('knowledge_documents')
    .insert({
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      published: true,
      updated_by: guard.userId,
    })
    .select('id')
    .single();
  if (error || !data) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  const pieces = chunkNote(parsed.data.body);
  if (pieces.length > 0) {
    const { error: chunkError } = await admin.from('knowledge_chunks').insert(
      pieces.map((content, ordinal) => ({ document_id: data.id, ordinal, content })),
    );
    if (chunkError) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  await audit(guard.userId, 'assistant.note_save', `knowledge:${data.id}`, { title: parsed.data.title, audience: parsed.data.audience });
  return NextResponse.json({ id: data.id });
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
