'use client';

import { useEffect } from 'react';

/**
 * Keeps staff_presence warm while the console is open so the visitor desk can
 * show "Live now" recruiters. Posts every 90 seconds; marks offline on unload.
 */
export function PresenceHeartbeat({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const beat = (online: boolean) => {
      void fetch('/api/admin/chat/presence', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ online }),
        keepalive: !online,
      }).catch(() => undefined);
    };

    beat(true);
    const timer = window.setInterval(() => beat(true), 90_000);
    const offline = () => beat(false);
    window.addEventListener('pagehide', offline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', offline);
      offline();
    };
  }, [enabled]);

  return null;
}
