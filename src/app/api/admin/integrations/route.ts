import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { managedField } from '@/lib/integrations/catalog';
import { canEncrypt, encryptValue } from '@/lib/integrations/crypto';
import { refreshIntegrations } from '@/lib/integrations/runtime';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z
  .object({
    values: z.record(z.string().max(64), z.string().max(4000)).default({}),
    clear: z.array(z.string().max(64)).max(50).default([]),
  })
  .strict();

/**
 * Saves or clears integration values.
 *
 * Only names in the catalogue are accepted, so this cannot be used to set an
 * arbitrary environment variable. Values are encrypted before they reach the
 * database, and the audit log records which names changed, never the values.
 */
export async function PUT(request: Request) {
  const guard = await apiPermission('integrations.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const entries = Object.entries(parsed.data.values)
    .map(([name, value]) => [name, value.trim()] as const)
    .filter(([, value]) => value.length > 0);
  const names = [...entries.map(([name]) => name), ...parsed.data.clear];
  const unknown = names.filter((name) => !managedField(name));
  if (unknown.length > 0) return NextResponse.json({ error: 'unknown_field', fields: unknown }, { status: 422 });

  for (const [name, value] of entries) {
    const options = managedField(name)?.options;
    if (options && !options.includes(value)) return NextResponse.json({ error: 'invalid_option', field: name }, { status: 422 });
  }

  if (entries.length > 0 && !canEncrypt()) {
    return NextResponse.json({ error: 'master_key_missing' }, { status: 503 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  if (entries.length > 0) {
    const rows = entries.map(([name, value]) => ({
      name,
      ...encryptValue(value),
      /* The last four characters, so staff can tell which key is in use
         without the key ever being shown. Empty for short values. */
      hint: managedField(name)?.secret && value.length >= 12 ? value.slice(-4) : '',
      updated_by: guard.userId,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await admin.from('integration_secrets').upsert(rows, { onConflict: 'name' });
    if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  if (parsed.data.clear.length > 0) {
    const { error } = await admin.from('integration_secrets').delete().in('name', parsed.data.clear);
    if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  await audit(guard.userId, 'integrations.update', 'integrations', {
    saved: entries.map(([name]) => name),
    cleared: parsed.data.clear,
  });
  await refreshIntegrations(true);
  return NextResponse.json({ ok: true });
}
