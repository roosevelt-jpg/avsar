import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every console API checks who is calling before it does anything.
 *
 * A route added without `apiPermission` is a hole that no page guard covers,
 * and it is the kind of mistake review misses because the route works. This
 * reads the source of every handler under /api/admin and /api/employer and
 * fails if a handler has no guard, or reaches the service role before it.
 */

const ROOT = join(__dirname, '..', '..', 'src', 'app', 'api');
const HANDLER = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g;
const STAFF_GUARD = /\b(apiPermission|apiAnyPermission|apiStaff)\s*\(/;
const EMPLOYER_GUARD = /\bgetSessionEmployer\s*\(/;

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routes(path);
    return name === 'route.ts' ? [path] : [];
  });
}

/** Each exported handler, with the source up to the next handler. */
function handlers(source: string): { method: string; body: string }[] {
  const starts = [...source.matchAll(HANDLER)].map((m) => ({ method: m[1]!, index: m.index! }));
  return starts.map((start, i) => ({ method: start.method, body: source.slice(start.index, starts[i + 1]?.index ?? source.length) }));
}

function check(dir: string, guard: RegExp) {
  const problems: string[] = [];
  for (const file of routes(join(ROOT, dir))) {
    const name = relative(ROOT, file).replace(/\\/g, '/');
    for (const { method, body } of handlers(readFileSync(file, 'utf8'))) {
      const guardAt = body.search(guard);
      if (guardAt === -1) {
        problems.push(`${name} ${method}: no guard`);
        continue;
      }
      const adminAt = body.search(/\bgetAdminSupabase\s*\(/);
      if (adminAt !== -1 && adminAt < guardAt) problems.push(`${name} ${method}: service role before the guard`);
    }
  }
  return problems;
}

describe('API guards', () => {
  it('every /api/admin handler checks a permission first', () => {
    expect(check('admin', STAFF_GUARD)).toEqual([]);
  });

  it('every /api/employer handler resolves the employer from the session first', () => {
    expect(check('employer', EMPLOYER_GUARD)).toEqual([]);
  });

  it('finds the handlers it is meant to check', () => {
    expect(routes(join(ROOT, 'admin')).length).toBeGreaterThan(20);
  });
});
