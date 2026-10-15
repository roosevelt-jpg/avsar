/**
 * One JSON line per event, with the request id on it.
 *
 * Vercel keeps function logs as text; a JSON line per event is something the
 * log search can filter on (`event`, `level`, `requestId`) instead of
 * grepping prose. The request id is set in `src/proxy.ts` and sent back to the
 * browser as `x-request-id`, so a candidate's "it failed" screenshot or a
 * support ticket can be matched to the exact server log.
 *
 * Edge-safe: no Node imports. Never throws.
 */

export const REQUEST_ID_HEADER = 'x-request-id';

type Level = 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;

/** The id the proxy stamped on this request, or null outside a request. */
export function requestIdOf(request: Request | { headers: Headers } | null | undefined): string | null {
  return request?.headers.get(REQUEST_ID_HEADER) ?? null;
}

/** A short random id: enough to tell requests apart in a day of logs. */
export function newRequestId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

/* Errors do not survive JSON.stringify (their fields are not enumerable), and
   a Supabase error is a plain object with a message and a code. */
function serialise(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack?.split('\n').slice(0, 6).join('\n') };
  }
  return value;
}

function write(level: Level, event: string, fields: Fields): void {
  try {
    const line: Fields = { ts: new Date().toISOString(), level, event };
    for (const [key, value] of Object.entries(fields)) line[key] = serialise(value);
    const text = JSON.stringify(line);
    if (level === 'error') console.error(text);
    else if (level === 'warn') console.warn(text);
    else console.log(text);
  } catch {
    console.error(`[log] could not write ${event}`);
  }
}

/**
 *   log.error('applications.insert_failed', { requestId: requestIdOf(request), error });
 *
 * Event names are `area.what_happened`, so a search for `applications.` finds
 * everything that area logged.
 */
export const log = {
  info: (event: string, fields: Fields = {}) => write('info', event, fields),
  warn: (event: string, fields: Fields = {}) => write('warn', event, fields),
  error: (event: string, fields: Fields = {}) => write('error', event, fields),
};
