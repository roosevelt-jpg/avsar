import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission, can, demoWriteRefusal } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

const roleKey = z.string().regex(/^[a-z][a-z0-9_]{1,40}$/);

const inviteSchema = z.object({
  email: z.string().trim().email().max(200),
  fullName: z.string().trim().min(2).max(120),
  role: roleKey,
});

const updateSchema = z.object({
  userId: z.string().uuid(),
  role: roleKey.optional(),
  active: z.boolean().optional(),
});

async function roleExists(admin: NonNullable<ReturnType<typeof getAdminSupabase>>, key: string) {
  const { data } = await admin.from('roles').select('key').eq('key', key).maybeSingle();
  return Boolean(data);
}

/**
 * Invites a staff member with a role.
 *
 * No password is chosen for them: the account is created confirmed and they
 * receive a link to set their own, the same as employer contacts. Granting
 * super_admin needs roles.manage, so an admin cannot mint a super admin.
 */
export async function POST(request: Request) {
  const guard = await apiPermission('staff.manage');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'validation_failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  const { fullName, role } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  if (role === 'super_admin' && !can(guard, 'roles.manage')) {
    return NextResponse.json({ error: 'forbidden', need: 'roles.manage' }, { status: 403 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });
  if (!(await roleExists(admin, role))) return NextResponse.json({ error: 'unknown_role' }, { status: 422 });

  /* One account, one side: a candidate's login must not become a staff login. */
  const { data: asCandidate } = await admin.from('candidates').select('id').ilike('email', email).maybeSingle();
  if (asCandidate) return NextResponse.json({ error: 'email_is_candidate' }, { status: 409 });

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let userId = list?.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: fullName } });
    if (error || !created.user) {
      console.error('[staff] user create failed', error?.message);
      return NextResponse.json({ error: 'user_create_failed' }, { status: 502 });
    }
    userId = created.user.id;
  }

  const { error: upsertError } = await admin
    .from('staff_users')
    .upsert({ auth_user_id: userId, email, full_name: fullName, role, active: true, invited_by: guard.userId });
  if (upsertError) {
    console.error('[staff] upsert failed', upsertError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const { error: inviteError } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/admin/dashboard')}`,
  });

  await audit(guard.userId, 'staff.invite', `staff:${userId}`, { email, role });
  return NextResponse.json({ status: 'invited', userId, emailSent: !inviteError });
}

/** Changes a staff member's role or deactivates them. Nobody can lock themselves, or the last super admin, out. */
export async function PATCH(request: Request) {
  const guard = await apiPermission('staff.manage');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const { userId, role, active } = parsed.data;

  if (userId === guard.userId) return NextResponse.json({ error: 'cannot_change_self' }, { status: 409 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: target } = await admin.from('staff_users').select('role, active').eq('auth_user_id', userId).maybeSingle();
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const touchesSuper = target.role === 'super_admin' || role === 'super_admin';
  if (touchesSuper && !can(guard, 'roles.manage')) return NextResponse.json({ error: 'forbidden', need: 'roles.manage' }, { status: 403 });
  if (role && !(await roleExists(admin, role))) return NextResponse.json({ error: 'unknown_role' }, { status: 422 });

  if (target.role === 'super_admin' && (active === false || (role && role !== 'super_admin'))) {
    const { count } = await admin.from('staff_users').select('auth_user_id', { count: 'exact', head: true }).eq('role', 'super_admin').eq('active', true);
    if ((count ?? 0) <= 1) return NextResponse.json({ error: 'last_super_admin' }, { status: 409 });
  }

  const update: Record<string, unknown> = {};
  if (role) update.role = role;
  if (active !== undefined) update.active = active;
  const { error } = await admin.from('staff_users').update(update).eq('auth_user_id', userId);
  if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });

  await audit(guard.userId, 'staff.update', `staff:${userId}`, { from: target, to: update });
  return NextResponse.json({ ok: true });
}
