/**
 * Google Places API (New) helpers for the server proxy.
 *
 * The key never leaves the server. Callers refresh integrations first so a
 * value saved in the console is live.
 */

export type PlaceSuggestion = {
  placeId: string;
  /** Short line shown in the dropdown. */
  label: string;
  /** Secondary line (region / country), when Google sends one. */
  secondary: string;
};

export type PlaceDetails = {
  placeId: string;
  /** Compact "City, State, Country" for storage in city_state. */
  formatted: string;
  countryCode: string | null;
};

function apiKey(): string | null {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  return key || null;
}

export function placesConfigured(): boolean {
  return Boolean(apiKey());
}

/** Autocomplete cities and towns, optionally restricted to one country. */
export async function autocompletePlaces(input: {
  query: string;
  country?: string;
  language?: string;
  sessionToken?: string;
}): Promise<PlaceSuggestion[]> {
  const key = apiKey();
  if (!key) return [];

  const body: Record<string, unknown> = {
    input: input.query,
    includedPrimaryTypes: ['locality', 'administrative_area_level_2', 'postal_town', 'sublocality'],
  };
  if (input.country && /^[A-Za-z]{2}$/.test(input.country)) {
    body.includedRegionCodes = [input.country.toLowerCase()];
  }
  if (input.language) body.languageCode = input.language;
  if (input.sessionToken) body.sessionToken = input.sessionToken;

  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error('[places] autocomplete failed', response.status, await response.text());
    return [];
  }

  const payload = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
      };
    }>;
  };

  return (payload.suggestions ?? [])
    .map((item) => {
      const pred = item.placePrediction;
      if (!pred?.placeId) return null;
      const label = pred.structuredFormat?.mainText?.text || pred.text?.text || '';
      const secondary = pred.structuredFormat?.secondaryText?.text || '';
      if (!label) return null;
      return { placeId: pred.placeId, label, secondary };
    })
    .filter((item): item is PlaceSuggestion => Boolean(item))
    .slice(0, 8);
}

type AddressComponent = { longText?: string; shortText?: string; types?: string[] };

function component(parts: AddressComponent[], type: string): AddressComponent | undefined {
  return parts.find((part) => part.types?.includes(type));
}

/** Resolve a prediction into a stable city/state/country string. */
export async function placeDetails(input: {
  placeId: string;
  language?: string;
  sessionToken?: string;
}): Promise<PlaceDetails | null> {
  const key = apiKey();
  if (!key) return null;

  const id = input.placeId.replace(/^places\//, '');
  const params = new URLSearchParams();
  if (input.language) params.set('languageCode', input.language);
  if (input.sessionToken) params.set('sessionToken', input.sessionToken);
  const qs = params.toString();

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,displayName',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error('[places] details failed', response.status, await response.text());
    return null;
  }

  const payload = (await response.json()) as {
    id?: string;
    formattedAddress?: string;
    displayName?: { text?: string };
    addressComponents?: AddressComponent[];
  };

  const parts = payload.addressComponents ?? [];
  const locality =
    component(parts, 'locality')?.longText ||
    component(parts, 'postal_town')?.longText ||
    component(parts, 'sublocality')?.longText ||
    component(parts, 'administrative_area_level_3')?.longText ||
    payload.displayName?.text ||
    '';
  const region =
    component(parts, 'administrative_area_level_1')?.longText ||
    component(parts, 'administrative_area_level_2')?.longText ||
    '';
  const country = component(parts, 'country')?.longText || '';
  const countryCode = component(parts, 'country')?.shortText?.toUpperCase() ?? null;

  const formatted = [locality, region, country].filter(Boolean).join(', ') || payload.formattedAddress || locality;
  if (!formatted) return null;

  return {
    placeId: payload.id ?? `places/${id}`,
    formatted: formatted.slice(0, 120),
    countryCode,
  };
}
