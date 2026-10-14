import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission, demoWriteRefusal } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { safeUrl } from '@/lib/cms/sanitize';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

const text = (max: number) => z.string().trim().max(max);
const url = z.string().trim().max(500).transform((value) => (value ? safeUrl(value) : ''));
const nav = z.object({ label: text(40).min(1), labelHi: text(40).optional(), labelAr: text(40).optional(), href: url });

/** One schema per settings key. Unknown keys are refused, so nothing arbitrary lands in a public table. */
const schemas = {
  general: z.object({
    siteName: text(80).min(1),
    tagline: text(160),
    supportPhone: text(40),
    whatsapp: text(40),
    supportEmail: z.string().trim().email().max(200),
    officeAddress: text(300),
    officeHours: text(160),
    socials: z.object({ instagram: url, facebook: url, linkedin: url, youtube: url }),
  }),
  announcement: z.object({ enabled: z.boolean(), text: text(240), linkLabel: text(60), href: url }),
  navigation: z.object({ items: z.array(nav).max(10), headerCta: z.object({ label: text(40), href: url }) }),
  footer: z.object({ blurb: text(400) }),
  applications: z.object({ requirePaidAssessment: z.boolean(), allowQuickApply: z.boolean() }),
  seo: z.object({ defaultTitle: text(80), defaultDescription: text(200), ogImage: url }),
} as const;

const bodySchema = z.object({ key: z.enum(['general', 'announcement', 'navigation', 'footer', 'applications', 'seo']), value: z.unknown() });

export async function PUT(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  /* Application rules change who can apply, which is a recruitment decision,
     not a content one. */
  const guard = await apiPermission(body.data.key === 'applications' ? 'jobs.publish' : 'settings.manage');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const parsed = schemas[body.data.key].safeParse(body.data.value);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_failed', issues: parsed.error.flatten() }, { status: 422 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { error } = await admin
    .from('site_settings')
    .upsert({ key: body.data.key, value: parsed.data, updated_by: guard.userId, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });

  await audit(guard.userId, 'settings.update', `settings:${body.data.key}`);
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
