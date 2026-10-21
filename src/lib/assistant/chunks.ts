/**
 * Splits a company note into pieces a search can rank.
 *
 * Paragraphs stay whole until a piece would pass about 900 characters, which
 * is long enough to hold one policy and short enough that a match is the
 * passage the answer should use, not a whole manual.
 */
export function chunkNote(body: string): string[] {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  const pieces: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > 900 && current) {
      pieces.push(current);
      current = paragraph.slice(0, 4000);
    } else {
      current = next.slice(0, 4000);
    }
  }
  if (current) pieces.push(current);
  return pieces.slice(0, 80);
}
