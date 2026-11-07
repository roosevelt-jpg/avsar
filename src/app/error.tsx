'use client';

import { useEffect } from 'react';

/**
 * Segment error boundary so a client crash on one page does not replace the
 * whole document the way global-error does. Still honest and short.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('route error', error.digest ?? error.message, error);
  }, [error]);

  return (
    <main style={{ maxWidth: 480, margin: '48px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif', color: '#1b1a17' }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
      <p style={{ fontSize: 16, lineHeight: 1.6 }}>This page could not finish loading. Your account is not affected.</p>
      {error.digest ? <p style={{ fontSize: 13, color: '#6b6760' }}>Reference {error.digest}</p> : null}
      <button
        type="button"
        onClick={reset}
        style={{ marginTop: 24, padding: '12px 20px', borderRadius: 999, border: 0, background: '#1b1a17', color: '#fff', fontSize: 15, cursor: 'pointer' }}
      >
        Try again
      </button>
    </main>
  );
}
