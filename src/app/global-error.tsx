'use client';

import Link from 'next/link';

/**
 * Last-resort error page, shown when the root layout itself fails.
 *
 * It replaces the whole document, so it carries its own html and body and no
 * design tokens. Server errors have already been reported by
 * `onRequestError`; the digest lets support match a screenshot to the log.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '48px 24px', color: '#1b1a17', background: '#faf8f4' }}>
        <main style={{ maxWidth: 480, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>
            The page could not load. Your application and account are not affected. Please try again in a moment.
          </p>
          {error.digest && <p style={{ fontSize: 13, color: '#6b6760' }}>Reference {error.digest}</p>}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              type="button"
              onClick={reset}
              style={{ padding: '12px 20px', borderRadius: 999, border: 0, background: '#1b1a17', color: '#fff', fontSize: 15, cursor: 'pointer' }}
            >
              Try again
            </button>
            <Link href="/" style={{ padding: '12px 20px', fontSize: 15, color: '#1b1a17' }}>
              Go to the home page
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
