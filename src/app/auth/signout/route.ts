import { NextResponse } from 'next/server';
import { localePath } from '@/lib/i18n/path';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Sign out. POST only: a GET would let any page log the user out with an
 * <img> tag, and prefetchers would do it by accident.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (supabase) await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}${localePath('en', '/')}`, { status: 303 });
}
