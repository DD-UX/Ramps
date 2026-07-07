import type { VendorStatusType } from '@ramps/schemas/vendors';

import type { VendorTab } from '../constants/vendor-tabs.constants';

/**
 * Vendors tab helpers — the thin logic over the {@link VENDOR_TABS} catalog.
 *
 * The sibling of `bill-tabs.helpers`, re-grained for vendors. The tab list is a
 * constant (vendors have no `vendor_tabs` DB table), but the LOGIC is identical:
 * resolve a `?tab=` code to a row, map a tab to its status group, roll per-status
 * counts up into a badge, and decide the href a tab switch navigates to.
 *
 * The default tab is the FIRST row ("All", `sort_order` implied by array order),
 * so there's no hardcoded default code.
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
 * The status filter for a tab — the array the facade passes to `status IN (…)`.
 * An empty group (the default/All tab) reads as "no filter".
 */
export function statusesForTab(tab: VendorTab): readonly VendorStatusType[] {
  return tab.statuses;
}

/**
 * The count badge for a tab — the sum of its grouped states. A tab with an
 * empty group (the default/All tab) is the grand total across every state, so
 * it counts the whole map.
 */
export function countForTab(
  tab: VendorTab,
  countsByStatus: Partial<Record<VendorStatusType, number>>,
): number {
  if (tab.statuses.length === 0) {
    return Object.values(countsByStatus).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  }
  return tab.statuses.reduce<number>((sum, status) => sum + (countsByStatus[status] ?? 0), 0);
}

/**
 * Roll the per-status counts up into one badge PER tab, keyed by tab `code` —
 * the map the tab bar reads.
 */
export function buildTabCounts(
  tabs: readonly VendorTab[],
  countsByStatus: Partial<Record<VendorStatusType, number>>,
): Record<VendorTab['code'], number> {
  return Object.fromEntries(tabs.map((tab) => [tab.code, countForTab(tab, countsByStatus)]));
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
