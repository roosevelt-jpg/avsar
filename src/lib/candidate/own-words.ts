/**
 * Lines the candidate actually wrote, taken from the rewrite's source notes.
 *
 * The rewritten CV is not their wording. `basedOn` is the phrase the rewrite
 * had to point at, so it is safe to show above a payment and call it theirs.
 * Two lines is enough for a parent to see that a person read the form.
 */

type Bullet = { basedOn?: string };
type Job = { bullets?: Bullet[] };

export function linesTheyWrote(cv: { experience?: Job[] } | null | undefined): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const job of cv?.experience ?? []) {
    for (const bullet of job.bullets ?? []) {
      const line = bullet.basedOn?.replace(/\s+/g, ' ').trim() ?? '';
      const key = line.toLowerCase();
      if (line.length < 8 || line.length > 180 || seen.has(key)) continue;
      seen.add(key);
      lines.push(line);
      if (lines.length === 2) return lines;
    }
  }
  return lines;
}
