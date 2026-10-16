'use client';

import { useEffect, useId, useRef, useState, useEffectEvent } from 'react';
import { DIAL_CODES } from '@/lib/data/dial-codes';

type Suggestion = { placeId: string; label: string; secondary: string };

/**
 * Country-scoped city/town picker backed by Google Places (via our proxy).
 *
 * When the Places key is missing, it degrades to a plain text field so sign-up
 * never blocks on integrations. Selecting a suggestion writes a compact
 * "City, Region, Country" string into `value` for storage in city_state.
 */
export function PlacePicker({
  value,
  onChange,
  country,
  onCountryChange,
  label,
  countryLabel,
  placeholder,
  error,
  inputClassName,
  language,
  showCountry = true,
}: {
  value: string;
  onChange: (next: string) => void;
  /** ISO 3166-1 alpha-2. Restricts suggestions when set. */
  country: string;
  onCountryChange?: (country: string) => void;
  label?: string;
  countryLabel?: string;
  placeholder?: string;
  error?: string;
  inputClassName: string;
  language?: string;
  showCountry?: boolean;
}) {
  const listId = useId();
  /* Null means show the committed `value`; a string is an in-progress edit. */
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [available, setAvailable] = useState(true);
  const sessionToken = useRef(cryptoRandom());
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shown = draft ?? value;

  const fetchSuggestions = useEffectEvent(async (trimmed: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          ...(country ? { country } : {}),
          language: language || undefined,
          sessionToken: sessionToken.current,
        }),
      });
      if (response.status === 503) {
        setAvailable(false);
        setSuggestions([]);
        setOpen(false);
        return;
      }
      if (!response.ok) {
        setSuggestions([]);
        return;
      }
      const data = (await response.json()) as { suggestions?: Suggestion[] };
      const next = data.suggestions ?? [];
      setSuggestions(next);
      setActiveIndex(-1);
      setOpen(next.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (!available) return;
    const trimmed = shown.trim();
    if (trimmed.length < 2) return;
    if (draft === null && value.includes(',')) return;

    const timer = setTimeout(() => {
      void fetchSuggestions(trimmed);
    }, 280);
    return () => clearTimeout(timer);
  }, [shown, draft, value, available, country, language]);

  async function pick(suggestion: Suggestion) {
    setOpen(false);
    setSuggestions([]);
    setLoading(true);
    try {
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          placeId: suggestion.placeId,
          language: language || undefined,
          sessionToken: sessionToken.current,
        }),
      });
      sessionToken.current = cryptoRandom();
      if (response.ok) {
        const place = (await response.json()) as { formatted?: string; countryCode?: string | null };
        if (place.formatted) {
          setDraft(null);
          onChange(place.formatted);
          if (place.countryCode && onCountryChange) onCountryChange(place.countryCode);
          return;
        }
      }
      const fallback = [suggestion.label, suggestion.secondary].filter(Boolean).join(', ');
      setDraft(null);
      onChange(fallback);
    } finally {
      setLoading(false);
    }
  }

  function commitTyped() {
    if (draft === null) return;
    const next = draft.trim();
    setDraft(null);
    if (next !== value) onChange(next);
  }

  return (
    <div className="relative flex flex-col gap-2">
      <div className={`grid gap-2 ${showCountry ? 'sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]' : 'grid-cols-1'}`}>
        {showCountry ? (
          <label className="block min-w-0">
            <span className={`mb-2 block text-[15px] font-medium ${countryLabel ? '' : 'sr-only'}`}>
              {countryLabel || 'Country'}
            </span>
            <select
              value={country}
              onChange={(event) => onCountryChange?.(event.target.value)}
              disabled={!onCountryChange}
              dir="ltr"
              aria-label={countryLabel || 'Country'}
              className={inputClassName}
            >
              {DIAL_CODES.map((entry) => (
                <option key={entry.country} value={entry.country}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block min-w-0">
          {label ? <span className="mb-2 block text-[15px] font-medium">{label}</span> : null}
          <input
            value={shown}
            onChange={(event) => {
              setDraft(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            onBlur={() => {
              blurTimer.current = setTimeout(() => {
                setOpen(false);
                commitTyped();
              }, 150);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false);
                return;
              }
              if (!open || suggestions.length === 0) return;
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === 'Enter' && activeIndex >= 0) {
                event.preventDefault();
                const item = suggestions[activeIndex];
                if (item) void pick(item);
              }
            }}
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="address-level2"
            placeholder={placeholder || (available ? 'Start typing a city or town' : undefined)}
            className={inputClassName}
          />
        </label>
      </div>

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-[12px] border border-line bg-surface py-1 shadow-[0_16px_40px_-20px_rgba(27,26,23,0.45)]"
        >
          {suggestions.map((item, index) => (
            <li key={item.placeId} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`t-colors flex w-full cursor-pointer flex-col items-start gap-0.5 border-0 bg-transparent px-3.5 py-2.5 text-start hover:bg-surface-subtle ${
                  index === activeIndex ? 'bg-surface-subtle' : ''
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  void pick(item);
                }}
              >
                <span className="text-[15px] font-medium text-ink">{item.label}</span>
                {item.secondary ? <span className="text-[13px] text-muted">{item.secondary}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {loading ? <span className="sr-only">Searching places</span> : null}
      {error ? <p className="m-0 text-[13px] text-accent-deep">{error}</p> : null}
      {!available ? (
        <p className="m-0 text-[12px] text-muted">
          Type your city and state. Live suggestions need a Google Places key in Settings › Integrations.
        </p>
      ) : null}
    </div>
  );
}

function cryptoRandom(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
