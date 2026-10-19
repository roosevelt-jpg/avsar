'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';

/**
 * Keeps the dashboard current without a reload.
 *
 * Subscribes to Supabase Realtime for new applications, stage changes, new
 * candidates and payments (migration 0015 adds those tables to the realtime
 * publication; RLS still decides what each staff member receives). A burst of
 * changes is collapsed into one refresh. If Realtime is unavailable, it falls
 * back to refreshing every 60 seconds, and it pauses while the tab is hidden.
 */
export function LiveUpdates({ generatedAt }: { generatedAt: string }) {
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
      if (!poll) poll = setInterval(refresh, 60_000);
    };

    if (!supabase) {
      startPolling();
      return () => {
        if (poll) clearInterval(poll);
        if (timer.current) clearTimeout(timer.current);
      };
    }

    const channel = supabase
      .channel('console-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'candidates' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_postings' }, refresh)
      .subscribe((status: string) => {
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
  }, [router]);

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
