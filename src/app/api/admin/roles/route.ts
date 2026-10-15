import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

const key = z.string().regex(/^[a-z][a-z0-9_]{1,40}$/);

const putSchema = z.object({ role: key, permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length) });
const postSchema = z.object({ key, name: z.string().trim().min(2).max(60), description: z.string().trim().max(240).default('') });

/** Replaces a role's permission set. super_admin is fixed at "everything". */
export async function PUT(request: Request) {
  const guard = await apiPermission('roles.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  if (parsed.data.role === 'super_admin') return NextResponse.json({ error: 'super_admin_fixed' }, { status: 409 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: role } = await admin.from('roles').select('key').eq('key', parsed.data.role).maybeSingle();
  if (!role) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: before } = await admin.from('role_permissions').select('permission_key').eq('role_key', parsed.data.role);

  const { error: deleteError } = await admin.from('role_permissions').delete().eq('role_key', parsed.data.role);
  if (deleteError) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  if (parsed.data.permissions.length) {
    const { error } = await admin
      .from('role_permissions')
      .insert(parsed.data.permissions.map((permission) => ({ role_key: parsed.data.role, permission_key: permission })));
    if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  await audit(guard.userId, 'role.permissions', `role:${parsed.data.role}`, {
    before: (before ?? []).map((row) => row.permission_key),
    after: parsed.data.permissions,
  });
  return NextResponse.json({ ok: true });
}

/** Creates a custom role with no permissions; tick them in the matrix afterwards. */
export async function POST(request: Request) {
  const guard = await apiPermission('roles.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { error } = await admin.from('roles').insert({ ...parsed.data, is_system: false });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'role_exists' }, { status: 409 });
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }
  await audit(guard.userId, 'role.create', `role:${parsed.data.key}`);
  return NextResponse.json({ ok: true });
}

/** Deletes a custom role nobody holds. System roles stay. */
export async function DELETE(request: Request) {
  const guard = await apiPermission('roles.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = z.object({ role: key }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: role } = await admin.from('roles').select('is_system').eq('key', parsed.data.role).maybeSingle();
  if (!role) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (role.is_system) return NextResponse.json({ error: 'system_role' }, { status: 409 });

  const { count } = await admin.from('staff_users').select('auth_user_id', { count: 'exact', head: true }).eq('role', parsed.data.role);
  if ((count ?? 0) > 0) return NextResponse.json({ error: 'role_in_use' }, { status: 409 });

  const { error } = await admin.from('roles').delete().eq('key', parsed.data.role);
  if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  await audit(guard.userId, 'role.delete', `role:${parsed.data.role}`);
  return NextResponse.json({ ok: true });
}
