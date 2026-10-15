/**
 * What an employer may see before staff release a candidate's identity.
 *
 * The fee is paid by the employer on hire. If an employer can find a
 * candidate's surname, phone or LinkedIn in a profile, the hire can happen
 * around the platform, and the candidate loses the support (visa file,
 * arrival, residence permit) that comes with going through it. So names are
 * reduced to a first name and an initial, and contact details are cut out of
 * any free text an employer reads. Mirrors `masked_name()` in SQL. Pure.
 */

export function maskName(fullName: string | null | undefined): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Candidate';
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]!.charAt(0).toUpperCase()}.`;
}

const PATTERNS: RegExp[] = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\b(?:https?:\/\/|www\.)\S+/gi,
  /\b(?:linkedin|facebook|instagram|wa\.me|t\.me)\S*/gi,
  /(?<!\w)@[A-Za-z0-9_.]{3,}/g,
  /(?:\+|00)?\d[\d\s().-]{7,}\d/g,
];

export function redactContact(text: string | null | undefined): string {
  let out = text ?? '';
  for (const pattern of PATTERNS) out = out.replace(pattern, '[removed]');
  return out;
}
