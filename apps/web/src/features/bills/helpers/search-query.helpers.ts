/**
 * The URL math behind the Bill Pay toolbar's search box, split out of the
 * component so it can be unit-tested without a DOM. The toolbar debounces
 * keystrokes and then hands the trimmed term here; this decides the next
 * query string.
 *
 * Contract: search is a URL-state control, exactly like the tabs. Committing a
 * term sets `?q=`; clearing it (empty / whitespace) drops `?q=` — and in BOTH
 * cases every OTHER param (notably `?tab=`) survives untouched, so searching
 * never clears the active tab.
 */

/**
 * Fold a search term into an existing query string, returning the next one
 * (WITHOUT a leading `?`). The term is trimmed; an empty result removes `?q=`
 * rather than leaving `?q=` in the URL.
 *
 * @param currentQuery the page's current search string (with or without `?`)
 * @param term the raw text from the field (trimmed here, not by the caller)
 */
export function buildSearchQuery(currentQuery: string, term: string): string {
  const params = new URLSearchParams(currentQuery);
  const trimmed = term.trim();
  if (trimmed) params.set('q', trimmed);
  else params.delete('q');
  return params.toString();
}

/**
 * Normalise the raw `?q=` param the page reads off the URL into the value the
 * SDK's `listBills({ search })` wants: a trimmed, non-empty term, or `undefined`
 * for "no filter". A whitespace-only or missing param collapses to `undefined`
 * so a bare `?q=` (or `?q=%20`) never runs an empty `ILIKE '%%'` scan.
 *
 * Split out of the page's Server Component so this normalisation is a plain
 * tested function rather than an inline `raw?.trim() || undefined` the loader
 * happens to own.
 */
export function normalizeSearchParam(raw: string | undefined): string | undefined {
  return raw?.trim() || undefined;
}
