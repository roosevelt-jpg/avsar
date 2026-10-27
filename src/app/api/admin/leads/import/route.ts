import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { attachLeads } from '@/lib/console/same-person';
import { IMPORT_MAX_BYTES, parseCsv, readLeadRows } from '@/lib/leads/import';
import { apiPermission } from '@/lib/rbac/server';
import { withIdempotency } from '@/lib/security/idempotency';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z
  .object({
    fileName: z.string().trim().min(1).max(200),
    csv: z.string().min(1).max(IMPORT_MAX_BYTES),
    /** Read and report, write nothing: the "check this file" button. */
    dryRun: z.boolean().default(false),
  })
  .strict();

/**
 * A partner's list of people into the inbox.
 *
 * The file is parsed here, not in the browser, so the rules (what a phone
 * number is, what counts as the same person) live in one place. People who
 * are already a lead, by phone or email, are skipped rather than duplicated,
 * and nobody imported is messaged on WhatsApp unless the file says they agreed.
 */
export async function POST(request: Request) {
  const guard = await apiPermission('leads.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const { fileName, csv, dryRun } = parsed.data;

  const result = readLeadRows(parseCsv(csv));

  const admin = getAdminSupabase();
  let existing = new Set<string>();
  if (admin && result.leads.length > 0) {
    const phones = result.leads.map((l) => l.phone).filter((p): p is string => Boolean(p));
    const emails = result.leads.map((l) => l.email).filter((e): e is string => Boolean(e));
    const [byPhone, byEmail] = await Promise.all([
      phones.length ? admin.from('leads').select('phone').in('phone', phones) : Promise.resolve({ data: [] }),
      emails.length ? admin.from('leads').select('email').in('email', emails) : Promise.resolve({ data: [] }),
    ]);
    existing = new Set([
      ...((byPhone.data ?? []) as { phone: string | null }[]).map((r) => r.phone ?? ''),
      ...((byEmail.data ?? []) as { email: string | null }[]).map((r) => (r.email ?? '').toLowerCase()),
    ]);
  }

  const fresh = result.leads.filter((l) => !(l.phone && existing.has(l.phone)) && !(l.email && existing.has(l.email)));
  const duplicates = result.leads.length - fresh.length;
  const summary = { ready: fresh.length, duplicates, problems: result.problems.slice(0, 200), unmatchedColumns: result.unmatchedColumns };

  if (dryRun) return NextResponse.json({ status: 'checked', ...summary });

  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  return withIdempotency(request, 'leads.import', guard.userId, async () => {
    for (let i = 0; i < fresh.length; i += 500) {
      const { error } = await admin.from('leads').insert(
        fresh.slice(i, i + 500).map((l) => ({
          kind: 'import',
          topic: 'candidate',
          full_name: l.fullName,
          email: l.email,
          phone: l.phone,
          whatsapp_ok: Boolean(l.phone) && l.whatsappOk,
          message: l.message,
          position: l.position,
          city: l.city,
          source: fileName,
        })),
      );
      if (error) {
        return NextResponse.json({ error: 'save_failed', imported: i, ...summary }, { status: 500 });
      }
    }
    const emails = [...new Set(fresh.map((row) => row.email?.toLowerCase()).filter((value): value is string => Boolean(value)))];
    const phones = [...new Set(fresh.map((row) => row.phone).filter((value): value is string => Boolean(value)))];
    const [byEmail, byPhone] = await Promise.all([
      emails.length ? admin.from('candidates').select('id, email, phone').in('email', emails.slice(0, 200)) : Promise.resolve({ data: [] }),
      phones.length ? admin.from('candidates').select('id, email, phone').in('phone', phones.slice(0, 200)) : Promise.resolve({ data: [] }),
    ]);
    const people = new Map<string, { email: string | null; phone: string | null }>();
    for (const person of [...(byEmail.data ?? []), ...(byPhone.data ?? [])]) {
      people.set(String(person.id), { email: (person.email as string | null) ?? null, phone: (person.phone as string | null) ?? null });
    }
    for (const [id, person] of people) {
      await attachLeads({ candidateId: id, email: person.email, phone: person.phone, actor: guard.userId });
    }
    await audit(guard.userId, 'lead.import', `file:${fileName}`, { imported: fresh.length, duplicates, problems: result.problems.length });
    return NextResponse.json({ status: 'imported', imported: fresh.length, ...summary });
  });
}
