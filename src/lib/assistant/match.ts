/**
 * Decides whether a question is answered by one note, or by none.
 *
 * A shared word is not enough. "Visa" appears in almost every note, so a
 * question that only shares that word gets no answer. Two notes that fit
 * equally well also get no answer: picking one would be a guess.
 */

const STOP = new Set([
  'what', 'when', 'where', 'which', 'who', 'why', 'how', 'does', 'did', 'the', 'and', 'for', 'with', 'this', 'that',
  'your', 'you', 'our', 'can', 'are', 'from', 'have', 'will', 'about', 'into', 'only', 'not', 'but', 'any', 'all',
  'its', 'was', 'were', 'they', 'their', 'there', 'here', 'please', 'tell', 'know', 'need', 'want', 'much', 'many',
  'more', 'than', 'then', 'also', 'just', 'like', 'get', 'got', 'has', 'had', 'been', 'being', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'dont', 'isn', 'wasn',
]);

export type Passage = { title: string; content: string };

export function meaningfulTokens(text: string): string[] {
  const raw = text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  const tokens: string[] = [];
  for (const token of raw) {
    if (STOP.has(token)) continue;
    if (token.length < 4 && !/^\d+$/.test(token)) continue;
    if (!tokens.includes(token)) tokens.push(token);
  }
  return tokens.slice(0, 12);
}

function hasToken(haystack: string, token: string): boolean {
  return haystack.toLowerCase().includes(token);
}

function scorePassage(passage: Passage, tokens: string[]): number {
  const haystack = `${passage.title}\n${passage.content}`;
  return tokens.filter((token) => hasToken(haystack, token)).length;
}

/** The sentences a visitor can be shown. Markdown markers are dropped. */
function plainSentences(content: string): string[] {
  const plain = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '');
  return plain
    .split(/\n+|(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter((sentence) => sentence.length > 1);
}

/**
 * One sentence from the single passage that fits, or null.
 * Null is the safe result: the caller then says it does not know.
 */
export function quoteMatch(question: string, passages: Passage[]): { title: string; content: string } | null {
  const tokens = meaningfulTokens(question);
  if (tokens.length === 0 || passages.length === 0) return null;

  const scored = passages
    .map((passage) => ({ passage, score: scorePassage(passage, tokens) }))
    .filter((row) => row.score > 0);
  if (scored.length === 0) return null;

  const best = Math.max(...scored.map((row) => row.score));
  let top = scored.filter((row) => row.score === best);
  if (top.length > 1) {
    const notes = top.filter((row) => row.passage.title !== 'Site settings');
    if (notes.length === 1) top = notes;
    else return null;
  }
  const winner = top[0];
  if (!winner) return null;

  const matched = tokens.filter((token) => hasToken(`${winner.passage.title}\n${winner.passage.content}`, token));
  const only = matched[0];
  /* One short word, such as "visa", is shared by too many notes to be an answer. */
  if (best === 1 && (!only || only.length < 6)) return null;

  const sentences = plainSentences(winner.passage.content);
  let chosen = '';
  let chosenScore = 0;
  for (const sentence of sentences) {
    const score = tokens.filter((token) => hasToken(sentence, token)).length;
    if (score > chosenScore || (score === chosenScore && score > 0 && sentence.length > chosen.length)) {
      chosen = sentence;
      chosenScore = score;
    }
  }
  if (chosenScore < 1) return null;
  return { title: winner.passage.title, content: chosen.slice(0, 700) };
}

/**
 * Notes worth showing the model. Weak or tied matches are left out, so it
 * cannot answer from a neighbouring topic that happened to share one word.
 */
export function supportingPassages(question: string, passages: Passage[]): Passage[] {
  const tokens = meaningfulTokens(question);
  if (tokens.length === 0) return [];
  const ranked = passages
    .filter((passage) => passage.title !== 'Site settings')
    .map((passage) => ({ passage, score: scorePassage(passage, tokens) }))
    .filter((row) => row.score >= 2)
    .sort((a, b) => b.score - a.score);
  if (ranked.length > 0) return ranked.slice(0, 4).map((row) => row.passage);
  const only = quoteMatch(question, passages.filter((passage) => passage.title !== 'Site settings'));
  if (!only) return [];
  return passages.filter((passage) => passage.title === only.title).slice(0, 1);
}

/**
 * An English reply has to use the words of the note it cites.
 * A reply in another script is not checked this way: the notes are often
 * English and the answer is a translation, which the citation check covers.
 */
export function replyStaysOnSource(question: string, reply: string, sourceText: string): boolean {
  const asked = meaningfulTokens(question);
  if (asked.length > 0 && !asked.some((token) => hasToken(sourceText, token))) return false;
  const said = meaningfulTokens(reply);
  if (said.length === 0) return true;
  const hits = said.filter((token) => hasToken(sourceText, token)).length;
  return hits / said.length >= 0.5;
}
