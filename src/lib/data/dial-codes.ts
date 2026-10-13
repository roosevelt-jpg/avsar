import { getCountries, getCountryCallingCode } from 'libphonenumber-js';

/**
 * Every country, with its dialling code.
 *
 * Built rather than typed. A hand-written list of two hundred and fifty
 * countries is a list with mistakes in it, and the mistakes land on the
 * candidates from the places nobody checked. `libphonenumber-js` carries the
 * calling codes and `Intl.DisplayNames` carries the names, both of which ship
 * with the platform and both of which are somebody else's job to keep current.
 *
 * The names are pinned to English on purpose. The list has to be identical on
 * the server and in the browser or React will refuse the hydration, and a
 * locale-dependent sort order is exactly the kind of thing that differs between
 * the two.
 */

export type DialCode = {
  /** ISO 3166-1 alpha-2, which is also what the validator wants. */
  country: string;
  name: string;
  /** Digits only, no plus. */
  dial: string;
};

const names = new Intl.DisplayNames(['en'], { type: 'region' });

export const DIAL_CODES: readonly DialCode[] = getCountries()
  .map((country) => ({
    country,
    name: names.of(country) ?? country,
    dial: getCountryCallingCode(country),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

/**
 * What the selector starts on.
 *
 * India, because that is where the candidates are. It is a default and not an
 * assumption: the field is the second thing on the form and changing it costs
 * one tap, which is what it costs the applicant already in Europe.
 *
 * It was the UAE for the week the jobs were there. Note that this is the
 * country of the applicant, not of the work, which is why it does not follow
 * the destination.
 */
export const DEFAULT_COUNTRY = 'IN';

export function dialFor(country: string): string | undefined {
  return DIAL_CODES.find((entry) => entry.country === country)?.dial;
}

export function isSupportedCountry(country: string): boolean {
  return DIAL_CODES.some((entry) => entry.country === country);
}
