/**
 * Phone numbers in E.164 (+919812345678), the only form WhatsApp accepts and
 * the only form two spreadsheets can be de-duplicated on.
 *
 * Numbers arrive as people type them: "98123 45678", "098123-45678",
 * "0091 98123 45678", "+91 (981) 234 5678". A bare national number is read as
 * Indian, because that is where nearly every candidate is; anything already
 * carrying a country code keeps it. What cannot be read is returned as null
 * rather than guessed, so a bad cell is reported instead of stored.
 */

const E164 = /^\+[1-9]\d{6,14}$/;

export function isE164(value: string): boolean {
  return E164.test(value);
}

/* Free text from a spreadsheet cell. The signup form's `toE164` in
   `lib/validation` takes a country picker and a national number instead. */
export function normalisePhone(raw: string | null | undefined, defaultCountryCode = '91'): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const plus = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  let candidate: string;
  if (plus) {
    candidate = `+${digits}`;
  } else if (digits.startsWith('00')) {
    candidate = `+${digits.slice(2)}`;
  } else {
    /* A leading 0 is the domestic trunk prefix in India and Portugal never
       uses one, so it is dropped before the country code goes on. */
    if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
    if (defaultCountryCode === '91' && digits.length === 12 && digits.startsWith('91')) candidate = `+${digits}`;
    else if (defaultCountryCode === '91' && digits.length !== 10) return null;
    else candidate = `+${defaultCountryCode}${digits}`;
  }

  if (!isE164(candidate)) return null;
  /* Indian mobiles are ten digits starting 6 to 9; a landline or a typo is not
     something WhatsApp will deliver to. */
  if (candidate.startsWith('+91') && !/^\+91[6-9]\d{9}$/.test(candidate)) return null;
  return candidate;
}
