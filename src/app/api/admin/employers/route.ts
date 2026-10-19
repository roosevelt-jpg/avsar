import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  country: z.string().trim().length(2).default('PT'),
  vatNumber: z.string().trim().max(40).optional(),
  /** The first contact. An employer with nobody who can sign in is a dead row. */
  contactEmail: z.string().trim().email().max(200),
});

/**
 * Adds an employer and the person who can sign in as them.
 *
 * Both in one request, on purpose. `employers` had a row and `employer_users`
 * had none, so the entire employer side of the product was unreachable: there
 * was no screen, no invite and no route that could create that link.
 *
 * The contact gets an account with no password. They set one through the normal
 * recovery flow, so no password is ever chosen for somebody else or sent to
 * them in an email, and the address is proved by the fact that they received
 * the link at all.
 */
export async function POST(request: Request) {
  const guard = await apiPermission('employers.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const input = parsed.data;
  const email = input.contactEmail.toLowerCase();

  /* An address that already belongs to a candidate must not be turned into an
     employer login: one account cannot be both sides of the same transaction. */
  const { data: asCandidate } = await admin
    .from('candidates')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (asCandidate) return NextResponse.json({ status: 'email_is_candidate' }, { status: 409 });

  const { data: employer, error: employerError } = await admin
    .from('employers')
    .insert({ name: input.name, country: input.country, vat_number: input.vatNumber || null })
    .select('id, name')
    .single();

  if (employerError || !employer) {
    console.error('[employers] insert failed', employerError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  /* Reuse the account if the person already has one, so a second employer
     contact for the same human does not fail on a unique constraint. */
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  let userId = list?.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (createError || !created.user) {
      console.error('[employers] user create failed', createError?.message);
      return NextResponse.json({ error: 'user_create_failed' }, { status: 502 });
    }
    userId = created.user.id;
  }

  const { error: linkError } = await admin
    .from('employer_users')
    .upsert({ auth_user_id: userId, employer_id: employer.id, role: 'recruiter' });

  if (linkError) {
    console.error('[employers] link failed', linkError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  /**
   * Send them a link to set a password.
   *
   * Failing to send is reported rather than swallowed: the employer and the
   * link both exist now, and a staff member who thinks an invitation went out
   * when it did not will wait a week before asking.
   */
  const origin = new URL(request.url).origin;
  const { error: inviteError } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/admin/employer')}`,
  });

  return NextResponse.json({
    status: 'created',
    employerId: employer.id,
    invited: !inviteError,
    inviteError: inviteError ? inviteError.message : null,
  });
}
