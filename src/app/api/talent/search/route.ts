import { NextResponse } from 'next/server';
import { searchSchema } from '@/lib/validation';
import { searchTalent } from '@/lib/talent-search';
import { getSessionEmployer } from '@/lib/auth';
import { can, getStaffAccess } from '@/lib/rbac/server';

export const runtime = 'nodejs';

/** Server-side talent search, for the employer portal and any future API client. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse({
    query: url.searchParams.get('q') ?? undefined,
    sector: url.searchParams.get('sector') ?? undefined,
    minEnglish: url.searchParams.get('minEnglish') ?? undefined,
    page: Number(url.searchParams.get('page') ?? 1),
    pageSize: Number(url.searchParams.get('pageSize') ?? 25),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query', issues: parsed.error.flatten() }, { status: 400 });
  }

  /* Staff need candidates.view (same as the search page). Employers need a
     vetted employer session. Anyone else gets 401/403, not an empty list. */
  const access = await getStaffAccess();
  const isStaff = can(access, 'candidates.view');
  if (access && !isStaff) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!isStaff && !(await getSessionEmployer())) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  /* Full names for staff only; employers get the shortened form unless released. */
  const result = await searchTalent({
    query: parsed.data.query,
    sector: parsed.data.sector,
    minEnglish: parsed.data.minEnglish ?? 'B1',
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
    maskNames: !isStaff,
  });

  return NextResponse.json(result);
}
