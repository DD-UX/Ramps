/**
 * The URL math behind the Vendors toolbar's search box, split out of the
 * component so it can be unit-tested without a DOM. The sibling of the bills
 * `search-query.helpers` — search is a URL-state control, exactly like the
 * tabs: committing a term sets `?q=`, clearing it drops `?q=`, and in both
 * cases every OTHER param (notably `?tab=`) survives untouched.
 */

/**
 * Fold a search term into an existing query string, returning the next one
 * (WITHOUT a leading `?`). The term is trimmed; an empty result removes `?q=`
 * rather than leaving `?q=` in the URL.
 */
export function buildSearchQuery(currentQuery: string, term: string): string {
  const params = new URLSearchParams(currentQuery);
  const trimmed = term.trim();
  if (trimmed) params.set('q', trimmed);
  else params.delete('q');
  return params.toString();
}

/**
 * Normalise the raw `?q=` param into the value `listVendors({ search })` wants:
 * a trimmed, non-empty term, or `undefined` for "no filter". A whitespace-only
 * or missing param collapses to `undefined` so a bare `?q=` never runs an empty
 * `ILIKE '%%'` scan.
 */
export function normalizeSearchParam(raw: string | undefined): string | undefined {
  return raw?.trim() || undefined;
}
