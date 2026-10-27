'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';

const LIVE_TABLES = [
  'applications',
  'candidates',
  'payments',
  'job_postings',
  'reports',
  'application_interviews',
  'conversion_signals',
  'leads',
  'legal_reviews',
  'relocation_documents',
] as const;

/**
 * Keeps a console page current without a reload.
 *
 * Subscribes to the tables behind the applicant desk, the employer desk, and
 * the open work. Realtime delivers a change only when that person's own
 * permissions already allow the row (migrations 0015 and 0034). A burst of
 * changes is collapsed into one refresh. Family links are not in the
 * publication, so a page can pass pollMs and still pick those up. If Realtime
 * is unavailable, it refreshes every 60 seconds, and it pauses while the tab
 * is hidden.
 */
export function LiveUpdates({ generatedAt, pollMs }: { generatedAt: string; pollMs?: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<'connecting' | 'live' | 'polling'>('connecting');
  const [pulse, setPulse] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          router.refresh();
          setPulse((p) => p + 1);
        }
      }, 1500);
    };

    const supabase = getBrowserSupabase();
    let poll: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      setMode('polling');
      if (!poll) poll = setInterval(refresh, pollMs ?? 60_000);
    };

    if (pollMs) poll = setInterval(refresh, pollMs);

    if (!supabase) {
      startPolling();
      return () => {
        if (poll) clearInterval(poll);
        if (timer.current) clearTimeout(timer.current);
      };
    }

    let channel = supabase.channel('console-live');
    for (const table of LIVE_TABLES) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, refresh);
    }
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') setMode('live');
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') startPolling();
    });

    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      if (poll) clearInterval(poll);
      if (timer.current) clearTimeout(timer.current);
      void supabase.removeChannel(channel);
    };
  }, [pollMs, router]);

  const time = new Date(generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] text-ink-2" aria-live="polite">
      <span className="relative flex size-2">
        {mode === 'live' && <span key={pulse} className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />}
        <span className={`relative inline-flex size-2 rounded-full ${mode === 'live' ? 'bg-success' : mode === 'polling' ? 'bg-employer' : 'bg-line-strong'}`} />
      </span>
      {mode === 'live' ? 'Live' : mode === 'polling' ? 'Auto-refresh every minute' : 'Connecting'}
      <span className="text-muted" suppressHydrationWarning>· updated {time}</span>
    </span>
  );
}
