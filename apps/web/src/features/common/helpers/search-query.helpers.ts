/**
 * The URL math behind a list page's search box, split out of the component so
 * it can be unit-tested without a DOM.
 *
 * This lives in `common` because it is genuinely ONE concern, not two that
 * happen to look alike: it is pure query-string manipulation with no knowledge
 * of what is being searched. Bill Pay and Vendors previously each owned a copy;
 * the copies had already drifted (only one reset pagination), which is the
 * usual way that shape of duplication reports a bug rather than a style issue.
 *
 * Contract: search is a URL-state control, exactly like the tabs. Committing a
 * term sets `?q=`; clearing it (empty / whitespace) drops `?q=` — and in BOTH
 * cases every OTHER param (notably `?tab=`) survives untouched, so searching
 * never clears the active tab.
 */

/**
 * Fold a search term into an existing query string, returning the next one
 * (WITHOUT a leading `?`). The term is trimmed; an empty result removes `?q=`
 * rather than leaving `?q=` in the URL. Either way `?page=` is dropped so a new
 * or cleared search lands on page 1 (never a page that no longer exists).
 *
 * The page reset is unconditional on purpose. It is required for Bill Pay,
 * which paginates, and is a no-op for any list that doesn't — there is no
 * `?page=` to delete. Making it conditional would mean a caller has to remember
 * to opt in the day its list grows a pager, which is exactly the mistake the
 * two former copies had already made.
 *
 * @param currentQuery the page's current search string (with or without `?`)
 * @param term the raw text from the field (trimmed here, not by the caller)
 */
export function buildSearchQuery(currentQuery: string, term: string): string {
  const params = new URLSearchParams(currentQuery);
  const trimmed = term.trim();
  if (trimmed) params.set('q', trimmed);
  else params.delete('q');
  // A changed search resets pagination — the prior page may exceed the new count.
  params.delete('page');
  return params.toString();
}

/**
 * Normalise the raw `?q=` param the page reads off the URL into the value the
 * SDK's `list*({ search })` wants: a trimmed, non-empty term, or `undefined`
 * for "no filter". A whitespace-only or missing param collapses to `undefined`
 * so a bare `?q=` (or `?q=%20`) never runs an empty `ILIKE '%%'` scan.
 *
 * Split out of the pages' Server Components so this normalisation is a plain
 * tested function rather than an inline `raw?.trim() || undefined` each loader
 * happens to own.
 */
export function normalizeSearchParam(raw: string | undefined): string | undefined {
  return raw?.trim() || undefined;
}
