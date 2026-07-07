import type { VendorReviewStateType } from '@ramps/schemas/vendors';

import type { VendorTab } from '../constants/vendor-tabs.constants';

/**
 * Vendors tab helpers — the thin logic over the {@link VENDOR_TABS} catalog.
 *
 * The sibling of `bill-tabs.helpers`, re-grained for vendors. The tab list is a
 * constant (vendors have no `vendor_tabs` DB table), but the LOGIC mirrors it:
 * resolve a `?tab=` code to a row, map a tab to its review-state group, and
 * decide the href a tab switch navigates to. No count badges — the workflow
 * tabs are empty by design, so there's nothing to roll up.
 *
 * The default tab is the FIRST row ("Overview"), so there's no hardcoded
 * default code.
 */

/** Index the tab rows by `code` for O(1) lookup. */
export function tabsByCode(tabs: readonly VendorTab[]): ReadonlyMap<string, VendorTab> {
  return new Map(tabs.map((tab) => [tab.code, tab]));
}

/**
 * Resolve a raw `?tab=` code to a real tab row. Anything unknown (missing,
 * garbage) falls back to the first tab — the catalog's own default — so a
 * hand-typed URL can never 500. An empty catalog is a broken build, not a user
 * path, so it fails loudly rather than handing back `undefined`.
 */
export function resolveTab(tabs: readonly VendorTab[], rawCode: string | undefined): VendorTab {
  if (rawCode) {
    const match = tabsByCode(tabs).get(rawCode);
    if (match) return match;
  }
  const first = tabs[0];
  if (!first) throw new Error('vendor tabs catalog is empty — no tab to resolve');
  return first;
}

/**
 * The review-state filter for a tab — the array the facade passes to
 * `review_state IN (…)`. An empty group (the default/Overview tab) reads as
 * "no filter".
 */
export function reviewStatesForTab(tab: VendorTab): readonly VendorReviewStateType[] {
  return tab.reviewStates;
}

/**
 * The href a tab switch navigates to. Selecting the DEFAULT tab (the catalog's
 * first row) drops the `?tab=` param — landing on the bare pathname — rather
 * than writing `?tab=<default>`; every other tab gets `?tab=<code>` (encoded).
 * Owns only the `?tab=` decision; a tab switch resets the search.
 */
export function tabHref(
  pathname: string,
  code: VendorTab['code'],
  defaultCode: VendorTab['code'] | undefined,
): string {
  return code === defaultCode ? pathname : `${pathname}?tab=${encodeURIComponent(code)}`;
}
