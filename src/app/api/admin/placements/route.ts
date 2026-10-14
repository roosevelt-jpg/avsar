import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isPlacementState } from '@/lib/data/placements';

export const runtime = 'nodejs';

const schema = z.object({
  id: z.string().uuid(),
  state: z.string().refine(isPlacementState, 'unknown state'),
});

/**
 * Moves a placement, and records who moved it.
 *
 * The transition is written before the state, so a failure leaves a file with
 * a history that is one entry ahead rather than a state with no explanation.
 * Of the two, an unexplained state is the one nobody can reconstruct later.
 */
export async function PATCH(request: Request) {
  const staff = await apiPermission('placements.manage');
  if (staff instanceof NextResponse) return staff;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const supabase = await getServerSupabase();
  const admin = getAdminSupabase();
  if (!supabase || !admin) {
    return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });
  }

  const { data: current, error: readError } = await supabase
    .from('placements')
    .select('id, state')
    .eq('id', parsed.data.id)
    .maybeSingle();

  if (readError || !current) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (current.state === parsed.data.state) return NextResponse.json({ moved: false });

  const { error: historyError } = await admin.from('placement_transitions').insert({
    placement_id: parsed.data.id,
    from_state: current.state,
    to_state: parsed.data.state,
    actor: staff.userId,
  });

  if (historyError) {
    console.error('[placements] transition insert failed', historyError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  const { error: stateError } = await supabase
    .from('placements')
    .update({ state: parsed.data.state })
    .eq('id', parsed.data.id);

  if (stateError) {
    console.error('[placements] state update failed', stateError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  return NextResponse.json({ moved: true, from: current.state, to: parsed.data.state });
}
