/**
 * The URL math behind the Bill Pay list's pagination, split out of the table so
 * it's unit-tested without a DOM — the read-side twin `normalizePageParam` and
 * the write-side `buildPageQuery`, mirroring the search helpers next door.
 *
 * Contract: the page is a URL-state control like the tabs and the search. The
 * footer commits a page with `?page=`; page 1 drops the param (the bare list is
 * page 1), and every OTHER param — notably `?tab=` and `?q=` — survives, so
 * flipping pages never clears the active tab or the search.
 */

/**
 * Normalise the raw `?page=` param the page reads off the URL into a 1-based
 * page number the SDK's `listBills({ page })` wants. Anything that isn't a
 * positive integer — missing, `0`, negative, `'2.5'`, `'abc'` — collapses to
 * `1`, so a hand-typed URL can never ask for a nonsensical page.
 */
export function normalizePageParam(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return 1;
  return n;
}

/**
 * Fold a target page into an existing query string, returning the next one
 * (WITHOUT a leading `?`). Page 1 removes `?page=` rather than writing
 * `?page=1` (the bare list is already page 1); every other page sets it. All
 * other params are preserved.
 *
 * @param currentQuery the page's current search string (with or without `?`)
 * @param page the 1-based target page
 */
export function buildPageQuery(currentQuery: string, page: number): string {
  const params = new URLSearchParams(currentQuery);
  if (page > 1) params.set('page', String(page));
  else params.delete('page');
  return params.toString();
}
