import { randomUUID } from 'node:crypto';

/**
 * Server error reporting to Sentry, over its envelope endpoint.
 *
 * No SDK: server errors reach us through Next's `onRequestError` hook, and one
 * POST per error is all that needs. Without `SENTRY_DSN` nothing is sent and
 * errors stay in the platform logs, as before. Request headers are never
 * forwarded, because they carry session cookies.
 */

type Dsn = { endpoint: string; key: string };

function parseDsn(value: string | undefined): Dsn | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const projectId = url.pathname.replace(/^\//, '');
    if (!url.username || !projectId) return null;
    return { endpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`, key: url.username };
  } catch {
    return null;
  }
}

export type ErrorContext = {
  path?: string;
  method?: string;
  routePath?: string;
  routeType?: string;
  digest?: string;
};

export async function captureServerError(error: unknown, context: ErrorContext = {}): Promise<void> {
  const dsn = parseDsn(process.env.SENTRY_DSN);
  if (!dsn) return;

  const err = error instanceof Error ? error : new Error(String(error));
  const eventId = randomUUID().replace(/-/g, '');
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: 'node',
    level: 'error',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    exception: { values: [{ type: err.name, value: err.message }] },
    /* Paths only, never query strings: those can hold emails and tokens. */
    request: context.path ? { url: context.path.split('?')[0], method: context.method } : undefined,
    tags: { route: context.routePath, route_type: context.routeType, digest: context.digest },
    extra: { stack: err.stack },
  };

  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');

  try {
    await fetch(`${dsn.endpoint}?sentry_key=${dsn.key}&sentry_version=7`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-sentry-envelope' },
      body: envelope,
      cache: 'no-store',
    });
  } catch (sendError) {
    console.error('[monitoring] could not reach Sentry', sendError);
  }
}
