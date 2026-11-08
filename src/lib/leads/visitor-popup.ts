/**
 * First-visit lead popup memory. Client-only. Once the visitor submits or
 * dismisses, the dialog stays away on later visits in this browser.
 */

export const VISITOR_LEAD_KEY = 'sa_visitor_lead_v1';

export type VisitorLeadPrefs = {
  decided: boolean;
  submitted: boolean;
};

export const DEFAULT_VISITOR_LEAD: VisitorLeadPrefs = { decided: false, submitted: false };

let cache: VisitorLeadPrefs | null = null;

export function readVisitorLeadPrefs(): VisitorLeadPrefs {
  if (typeof window === 'undefined') return DEFAULT_VISITOR_LEAD;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(VISITOR_LEAD_KEY);
    if (!raw) {
      cache = DEFAULT_VISITOR_LEAD;
      return cache;
    }
    const parsed = JSON.parse(raw) as Partial<VisitorLeadPrefs>;
    cache = {
      decided: Boolean(parsed.decided),
      submitted: Boolean(parsed.submitted),
    };
    return cache;
  } catch {
    cache = DEFAULT_VISITOR_LEAD;
    return cache;
  }
}

export function writeVisitorLeadPrefs(next: VisitorLeadPrefs) {
  if (typeof window === 'undefined') return;
  cache = next;
  window.localStorage.setItem(VISITOR_LEAD_KEY, JSON.stringify(next));
}
